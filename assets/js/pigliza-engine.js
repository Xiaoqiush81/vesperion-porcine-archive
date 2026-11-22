import { analyzePiglizaText, compactFrame, contextualizePiglizaAnalysis, normalizePiglizaText, reflectPorcinePhrase } from './pigliza-analyzer.js?v=20261122-pigliza-5';
import { selectPiglizaPlan } from './pigliza-policy.js?v=20261122-pigliza-5';
import { realizePiglizaPlan } from './pigliza-realizer.js?v=20261122-pigliza-5';

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

    // Ground unfamiliar vocabulary in the speaker's own definition.
    const definition = source.match(/^(?:(?:我们(?:这边|这里|行业里)|我说的)\s*)?([^，。！？?]{1,36}?)(?:是指|指的是)(.{1,160}?)[。！]?$/u)
      || source.match(/^(.{1,36}?) means (.{1,160}?)[.!]?$/iu);
    const question = source.match(/^(.{1,36}?)(?:是什么意思|指的是什么)[？?。]?$/u)
      || source.match(/^what does (.{1,36}?) mean[?？]?$/iu);
    if (definition || question) {
      const term = (definition || question)[1].trim();
      const key = term.normalize('NFKC').toLowerCase();
      const english = / means |^what does /iu.test(source);
      const index = this.memory.findIndex(value => parseMemory(value)?.termKey === key);
      if (question && index < 0) return english ? 'What does that term mean in your context?' : '小猪说的这个词，在你那里具体指什么？';
      const meaning = definition ? definition[2].trim() : parseMemory(this.memory[index]).meaning;
      if (definition) {
        if (index >= 0) this.memory.splice(index, 1);
        this.memory.push(JSON.stringify({termKey:key, meaning, topic:term, act:'definition'}));
        if (this.memory.length > this.memorySize) this.memory.shift();
      }
      this.activeFrame = {topic:term, act:'definition'};
      this.lastStrategy = 'definition';
      this.turn += 1;
      return english ? 'In your usage, “' + term + '” means “' + meaning + '”.' : '按小猪的用法，“' + term + '”指的是“' + meaning + '”。';
    }

    const analysis = contextualizePiglizaAnalysis(analyzePiglizaText(source, this.data), this.activeFrame, this.data);
    const plan = selectPiglizaPlan(analysis, this, this.data);
    let reply;
    if (plan?.strategy.id === 'social-follow' && this.activeFrame?.act === 'recall') {
      reply = this.recall();
      this.lastGroup = null;
      this.lastStrategy = 'memory';
    } else if (plan) {
      reply = realizePiglizaPlan(plan, this, this.random);
      if (!plan.strategy.meta) {
        this.lastGroup = plan.frame.primary?.id || null;
        this.lastStrategy = plan.strategy.id;
      }
    } else {
      reply = this.recall() || this.pick('fallback', this.data.fallbacks);
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
    this.activeFrame = parseMemory(this.memory.at(-1));
    this.quit = Boolean(state.quit);
  }
}
