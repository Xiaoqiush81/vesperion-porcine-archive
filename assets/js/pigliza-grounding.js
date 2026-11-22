import { detectPiglizaLocale, PIGLIZA_LOCALES } from './pigliza-locales.js?v=20261122-pigliza-7';

const MAX_TERMS = 24;
const MAX_BIAS = 24;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const keyOf = value => value.normalize('NFKC').trim().toLocaleLowerCase();

export function createPiglizaGrounding(saved = {}) {
  if (!saved || typeof saved !== 'object') saved = {};
  const terms = Array.isArray(saved.terms) ? saved.terms.filter(item => item && typeof item.term === 'string'
    && typeof item.meaning === 'string').slice(-MAX_TERMS).map(item => ({
      key:keyOf(item.key || item.term), term:item.term.slice(0, 80), meaning:item.meaning.slice(0, 320),
    })) : [];
  const bias = saved.bias && typeof saved.bias === 'object' ? Object.fromEntries(Object.entries(saved.bias)
    .filter(([key, value]) => key.length <= 80 && Number.isFinite(value))
    .map(([key, value]) => [key, clamp(value, -MAX_BIAS, MAX_BIAS)]).slice(0, 40)) : {};
  return {
    terms, bias,
    locale:['zh','en','unknown'].includes(saved.locale || saved.language) ? saved.locale || saved.language : 'zh',
    samples:Number.isInteger(saved.samples) ? clamp(saved.samples, 0, 100000) : 0,
    meanLength:Number.isFinite(saved.meanLength) ? clamp(saved.meanLength, 0, 1200) : 0,
    style:saved.style === 'brief' ? 'brief' : 'normal',
    mode:['casual','reflective'].includes(saved.mode) ? saved.mode : 'adaptive',
  };
}

function learnStyle(state, text) {
  const locale = detectPiglizaLocale(text);
  if (locale !== 'unknown') state.locale = locale;
  state.samples += 1;
  state.meanLength = state.samples === 1 ? text.length : state.meanLength * .75 + text.length * .25;
  state.style = state.samples >= 3 && state.meanLength <= 10 ? 'brief' : 'normal';
}

function rewardPrevious(state, strategy, text) {
  if (!strategy) return null;
  const pack = PIGLIZA_LOCALES[state.locale] || PIGLIZA_LOCALES.zh;
  const negative = pack.negative.test(text), positive = pack.positive.test(text);
  if (!negative && !positive) return null;
  state.bias[strategy] = clamp((state.bias[strategy] || 0) + (positive ? 4 : -8), -MAX_BIAS, MAX_BIAS);
  return negative ? pack.feedback.negative : pack.feedback.positive;
}

function controlMode(state, text) {
  const pack = PIGLIZA_LOCALES[state.locale] || PIGLIZA_LOCALES.zh;
  for (const [mode, pattern, reply] of pack.modes) if (pattern.test(text)) { state.mode = mode; return reply; }
  return '';
}

function learnTerm(state, text) {
  const pack = PIGLIZA_LOCALES[state.locale] || PIGLIZA_LOCALES.zh;
  const definition = text.match(pack.definition), question = text.match(pack.termQuestion);
  if (!definition && !question) return null;
  const term = (definition || question)[1].trim(), key = keyOf(term);
  const index = state.terms.findIndex(item => item.key === key);
  if (question && index < 0) return { topic:term, reply:pack.unknownTerm(term) };
  const meaning = definition ? definition[2].trim() : state.terms[index].meaning;
  if (definition) {
    if (index >= 0) state.terms.splice(index, 1);
    state.terms.push({ key, term, meaning });
    if (state.terms.length > MAX_TERMS) state.terms.shift();
  }
  return { topic:term, reply:pack.knownTerm(term, meaning) };
}

export function adaptPiglizaTurn(state, text, lastStrategy) {
  learnStyle(state, text);
  const modeReply = controlMode(state, text);
  if (modeReply) return { topic:'聊天方式', reply:modeReply, strategy:'mode-control' };
  const feedbackReply = rewardPrevious(state, lastStrategy, text);
  if (feedbackReply) return { topic:'回复方式', reply:feedbackReply, strategy:'feedback' };
  const term = learnTerm(state, text);
  return term ? { ...term, strategy:'definition' } : null;
}

export function groundPiglizaAnalysis(analysis, state) {
  const lower = analysis.text.toLocaleLowerCase();
  const known = state.terms.find(item => lower.includes(item.term.toLocaleLowerCase()));
  if (!known || !analysis.primary) return analysis;
  const frames = analysis.frames.map((frame, index) => index || frame.primary ? frame
    : { ...frame, topic:known.term, score:frame.score + 10 });
  return { ...analysis, frames, primary:frames[0] };
}

export function foreignPiglizaReply(state, text) {
  if (state.locale !== 'en') return '';
  const copy = PIGLIZA_LOCALES.en.fallback;
  if (/[?]$/u.test(text)) return copy.question;
  return state.style === 'brief' ? copy.brief : copy.statement;
}
