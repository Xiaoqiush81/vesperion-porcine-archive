import { detectPiglizaLocale, PIGLIZA_LOCALES } from './pigliza-locales.js?v=20261122-pigliza-8';

const ACTS = Object.freeze({
  'open-question':'ask', 'clarify-request':'repair', 'why-followup':'ask',
  'continue-chat':'continue', uncertain:'inform', statement:'inform',
  acknowledge:'react', disagree:'correct',
});

const clean = value => String(value || '').replace(/^[“”'"\s]+|[“”'"。！？!?\s]+$/gu, '').slice(0, 120);

export function createPiglizaBoard(saved = {}) {
  if (!saved || typeof saved !== 'object') saved = {};
  const pending = saved.pending && typeof saved.pending === 'object'
    && typeof saved.pending.operation === 'string'
    ? {
      operation:saved.pending.operation.slice(0, 40), slot:String(saved.pending.slot || '').slice(0, 40),
      topic:String(saved.pending.topic || '').slice(0, 80),
      concept:typeof saved.pending.concept === 'string' ? saved.pending.concept.slice(0, 80) : null,
      strategy:typeof saved.pending.strategy === 'string' ? saved.pending.strategy.slice(0, 80) : null,
    } : null;
  const focus = saved.focus && typeof saved.focus === 'object' ? {
    topic:String(saved.focus.topic || '').slice(0, 80),
    concept:typeof saved.focus.concept === 'string' ? saved.focus.concept.slice(0, 80) : null,
  } : { topic:'', concept:null };
  return { focus, pending };
}

function extractOptions(text, locale) {
  const separator = locale === 'en' ? /\s+(?:or|versus|vs\.?)\s+/iu : /\s*(?:还是|或者|或是)\s*/u;
  if (!separator.test(text)) return [];
  const prefix = locale === 'en'
    ? /^(?:do you think|help me choose|choose|should i)\s+/iu
    : /^(?:你觉得|帮我选(?:择)?|替我选|给我选|我(?:应该)?(?:吃|穿|玩|看)?)/u;
  return text.replace(/[。！？!?]+$/gu, '').replace(prefix, '').split(separator).map(clean)
    .filter(option => option && option.length <= 80).slice(0, 6);
}

function findDomain(capability, text, locale) {
  return capability?.domains?.find(domain => (domain.terms?.[locale] || []).some(term => text.toLocaleLowerCase().includes(term))) || null;
}

export function compilePiglizaTurn(source, analysis, savedBoard, capabilities = []) {
  const board = createPiglizaBoard(savedBoard), locale = detectPiglizaLocale(source);
  const pack = PIGLIZA_LOCALES[locale] || PIGLIZA_LOCALES.zh;
  const explicit = pack.operations?.find(operation => operation.patterns.some(pattern => pattern.test(source))) || null;
  const options = extractOptions(source, locale);
  const pendingOperation = board.pending?.operation;
  const operationId = explicit?.id || (options.length > 1 ? 'choose' : pendingOperation);
  const capability = capabilities.find(item => item.id === operationId) || null;
  const domain = findDomain(capability, source, locale);
  const operation = explicit || options.length > 1 || (pendingOperation && domain) ? operationId : null;
  const frame = analysis.primary;
  const answerBlocked = new Set(['open-question','clarify-request','why-followup','continue-chat','greeting','thanks',
    'laughter','insult','food-talk','bored','small-talk','disagree']).has(frame?.act?.id);
  const answersPending = !operation && pendingOperation === 'answer' && !answerBlocked && source.length <= 240;
  return {
    act:answersPending ? 'answer' : operation ? (explicit || options.length > 1 ? 'request' : 'answer')
      : ACTS[frame?.act?.id] || frame?.act?.id || 'inform',
    operation, domain:domain?.id || null, options,
    topic:frame?.topic || board.focus.topic || '', concept:answersPending ? board.pending.concept : frame?.primary?.id || null,
    locale:locale === 'unknown' ? 'zh' : locale,
    confidence:operation ? (domain || options.length > 1 ? 1 : .72) : frame ? .6 : .2,
  };
}

export function updatePiglizaBoard(saved, turn) {
  const board = createPiglizaBoard(saved);
  const preservesFocus = ['answer','repair','continue'].includes(turn.act);
  if (turn.topic || turn.concept) board.focus = { topic:turn.topic || board.focus.topic,
    concept:turn.concept || (preservesFocus ? board.focus.concept : null) };
  if (turn.act === 'correct') board.pending = null;
  return board;
}

export function groundPiglizaAnswer(analysis, turn, savedBoard, data) {
  const pending = createPiglizaBoard(savedBoard).pending;
  if (turn.act !== 'answer' || pending?.operation !== 'answer' || !analysis.primary) return analysis;
  const inherited = data.concepts.find(concept => concept.id === pending.concept) || null;
  const frame = analysis.primary, primary = frame.primary || inherited;
  const grounded = { ...frame, primary, act:{ id:'answer', priority:35, term:'', index:0 },
    acts:['answer'], topic:frame.topic || pending.topic, continuation:true, score:frame.score + 24 };
  return { ...analysis, frames:[grounded, ...analysis.frames.filter(item => item !== frame)], primary:grounded };
}

export function pendingForPiglizaPlan(plan) {
  if (!plan?.strategy?.expects) return null;
  return { operation:'answer', slot:plan.strategy.expects, topic:plan.frame.topic || '',
    concept:plan.frame.primary?.id || null, strategy:plan.strategy.id };
}

export function planPiglizaMoves(turn, data, state) {
  if (turn.operation !== 'choose') return null;
  const capability = data.capabilities?.find(item => item.id === 'choose');
  const domain = capability?.domains.find(item => item.id === turn.domain);
  const choices = turn.options.length > 1 ? turn.options : domain?.values?.[turn.locale] || domain?.values?.zh || [];
  if (!choices.length) return { strategy:'operation:choose', pending:{ operation:'choose', slot:'choice', topic:'', concept:null, strategy:'operation:choose' }, moves:[{ type:'choice-clarify' }] };
  const value = state.pick(`operation:choose:${turn.domain || 'options'}`, choices);
  return { strategy:'operation:choose', pending:null, moves:[{ type:'choice', slots:{ value } }] };
}
