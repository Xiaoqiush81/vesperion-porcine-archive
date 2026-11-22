import { analyzePiglizaText, compactFrame, contextualizePiglizaAnalysis, normalizePiglizaText, reflectPorcinePhrase } from './pigliza-analyzer.js?v=20261122-pigliza-8';
import { advancePiglizaDialogue, createPiglizaDialogue, selectPiglizaPlan } from './pigliza-policy.js?v=20261122-pigliza-9';
import { realizePiglizaMoves, realizePiglizaPlan } from './pigliza-realizer.js?v=20261122-pigliza-10';
import { adaptPiglizaTurn, createPiglizaGrounding, foreignPiglizaReply, groundPiglizaAnalysis } from './pigliza-grounding.js?v=20261122-pigliza-7';
import { compilePiglizaTurn, createPiglizaBoard, groundPiglizaAnswer, pendingForPiglizaPlan, planPiglizaMoves, queuePiglizaTopics, updatePiglizaBoard } from './pigliza-kernel.js?v=20261122-pigliza-3';

const DEFAULT_MEMORY_SIZE = 12;
export { reflectPorcinePhrase };

function choose(items, last, random) {
  if (!items?.length) return { value:'', index:-1 };
  let index = Math.floor(random() * items.length);
  if (items.length > 1 && index === last) index = (index + 1) % items.length;
  return { value:items[index], index };
}

function parseMemory(value) {
  try {
    const frame = JSON.parse(value);
    return frame && typeof frame === 'object' ? frame : null;
  } catch {
    return value ? { text:value, topic:value, concept:null, act:'legacy' } : null;
  }
}

export class PiglizaEngine {
  constructor(data, options = {}) {
    this.data = data;
    this.random = options.random || Math.random;
    this.memorySize = options.memorySize || DEFAULT_MEMORY_SIZE;
    this.reset();
  }

  reset() {
    this.memory = [];
    this.lastChoices = {};
    this.lastGroup = null;
    this.lastStrategy = null;
    this.activeFrame = null;
    this.turn = 0;
    this.quit = false;
    this.grounding = createPiglizaGrounding();
    this.dialogue = createPiglizaDialogue();
    this.board = createPiglizaBoard();
  }

  pick(key, items) {
    const selected = choose(items, this.lastChoices[key], this.random);
    this.lastChoices[key] = selected.index;
    return selected.value;
  }

  getGreeting() { return this.pick('greeting', this.data.greetings); }

  respond(input) {
    const source = normalizePiglizaText(input);
    if (!source) return this.pick('no-input', this.data.noInput);
    const farewell = source.replace(/[。！？!?～~\s]+/gu, '');
    if (this.data.quitPhrases.includes(farewell)) {
      this.quit = true;
      return this.pick('farewell', this.data.farewells);
    }
    if (this.data.crisisTerms.some(term => source.includes(term))) return this.data.crisisReply;
    const adapted = adaptPiglizaTurn(this.grounding, source, this.lastStrategy);
    if (adapted) {
      this.activeFrame = {topic:adapted.topic, act:adapted.strategy};
      this.lastStrategy = adapted.strategy;
      this.turn += 1;
      return adapted.reply;
    }
    let analysis = groundPiglizaAnalysis(contextualizePiglizaAnalysis(
      analyzePiglizaText(source, this.data), this.activeFrame, this.data), this.grounding);
    const turn = compilePiglizaTurn(source, analysis, this.board, this.data.capabilities);
    analysis = groundPiglizaAnswer(analysis, turn, this.board, this.data);
    this.board = queuePiglizaTopics(this.board, analysis);
    this.board = updatePiglizaBoard(this.board, turn);
    const operationPlan = planPiglizaMoves(turn, this.data, this, this.board);
    if (operationPlan) {
      const reply = realizePiglizaMoves(operationPlan, this, this.random);
      if (operationPlan.board) this.board = createPiglizaBoard({ ...this.board, ...operationPlan.board });
      this.board.pending = operationPlan.pending;
      this.lastGroup = turn.domain || turn.operation;
      this.lastStrategy = operationPlan.strategy;
      this.remember(analysis.primary);
      this.turn += 1;
      return reply;
    }
    if (turn.act === 'answer') this.board.pending = null;
    const otherLanguage = foreignPiglizaReply(this.grounding, source);
    if (otherLanguage) { this.lastStrategy = 'language-fallback'; this.turn += 1; return otherLanguage; }
    this.dialogue = advancePiglizaDialogue(this.dialogue, analysis.primary);
    const plan = selectPiglizaPlan(analysis, this, this.data);
    let reply;
    if (plan?.strategy.id === 'social-follow' && this.activeFrame?.act === 'recall') {
      reply = this.recall();
      this.lastGroup = null;
      this.lastStrategy = 'memory';
    } else if (plan) {
      reply = realizePiglizaPlan(plan, this, this.random);
      this.board.pending = pendingForPiglizaPlan(plan) || (plan.strategy.meta ? this.board.pending : null);
      if (!plan.strategy.meta) {
        this.lastGroup = plan.frame.primary?.id || null;
        this.lastStrategy = plan.strategy.id;
      }
    } else {
      reply = this.recall() || this.pick('fallback', this.data.fallbacks);
      this.board.pending = null;
      this.lastGroup = null;
      this.lastStrategy = reply.startsWith('刚才小猪') ? 'memory' : 'fallback';
    }
    this.remember(analysis.primary);
    this.turn += 1;
    return reply;
  }

  remember(frame) {
    const compact = compactFrame(frame);
    if (!compact || (!compact.topic && !compact.concept && compact.act !== 'recall')) return;
    const value = JSON.stringify(compact);
    this.activeFrame = compact;
    if (this.memory.at(-1) === value) return;
    this.memory.push(value);
    if (this.memory.length > this.memorySize) this.memory.shift();
  }

  recall() {
    const candidates = this.memory.map((value, index) => ({ value, index, frame:parseMemory(value) })).filter(item => item.frame && !item.frame.termKey);
    if (!candidates.length) return '';
    const chosen = candidates.reduce((best, item) => (item.frame.salience || 0) + item.index >= (best.frame.salience || 0) + best.index ? item : best);
    this.memory.splice(chosen.index, 1);
    const memory = chosen.frame;
    const topic = memory.act === 'legacy' ? reflectPorcinePhrase(memory.topic || memory.text) : memory.topic || memory.text || '那件事';
    return `刚才小猪提到过“${topic}”。它和现在说的事情有什么联系？`;
  }

  getState() {
    return {
      memory:[...this.memory], lastChoices:{ ...this.lastChoices }, lastGroup:this.lastGroup,
      lastStrategy:this.lastStrategy, turn:this.turn, quit:this.quit,
      grounding:createPiglizaGrounding(this.grounding),
      dialogue:createPiglizaDialogue(this.dialogue),
      board:createPiglizaBoard(this.board),
    };
  }

  setState(state) {
    if (!state || typeof state !== 'object') return;
    this.memory = Array.isArray(state.memory) ? state.memory.filter(value => typeof value === 'string').slice(-this.memorySize) : [];
    this.lastChoices = state.lastChoices && typeof state.lastChoices === 'object'
      ? Object.fromEntries(Object.entries(state.lastChoices).filter(([, value]) => Number.isInteger(value))) : {};
    this.lastGroup = typeof state.lastGroup === 'string' ? state.lastGroup : null;
    this.lastStrategy = typeof state.lastStrategy === 'string' ? state.lastStrategy : null;
    this.turn = Number.isInteger(state.turn) && state.turn >= 0 ? state.turn : 0;
    this.grounding = createPiglizaGrounding(state.grounding);
    this.dialogue = createPiglizaDialogue(state.dialogue);
    this.board = createPiglizaBoard(state.board);
    const legacyTerms = this.memory.map(parseMemory).filter(frame => frame?.termKey && frame.meaning);
    if (!state.grounding && legacyTerms.length) this.grounding = createPiglizaGrounding({ terms:legacyTerms.map(frame => ({
      key:frame.termKey, term:frame.topic || frame.termKey, meaning:frame.meaning,
    })) });
    if (legacyTerms.length) this.memory = this.memory.filter(value => !parseMemory(value)?.termKey);
    this.activeFrame = parseMemory(this.memory.at(-1));
    this.quit = Boolean(state.quit);
  }
}
