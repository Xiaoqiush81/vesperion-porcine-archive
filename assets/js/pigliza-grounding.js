const MAX_TERMS = 24;

const keyOf = value => value.normalize('NFKC').trim().toLocaleLowerCase();
const languageOf = text => /[\u3400-\u9fff]/u.test(text) ? 'zh' : /[a-z]/iu.test(text) ? 'en' : 'unknown';

export function createPiglizaGrounding(saved = {}) {
  if (!saved || typeof saved !== 'object') saved = {};
  const terms = Array.isArray(saved.terms) ? saved.terms.filter(item => item && typeof item.term === 'string'
    && typeof item.meaning === 'string').slice(-MAX_TERMS) : [];
  return {
    terms,
    language:['zh','en'].includes(saved.language) ? saved.language : 'zh',
    samples:Number.isInteger(saved.samples) ? Math.max(0, saved.samples) : 0,
    meanLength:Number.isFinite(saved.meanLength) ? Math.max(0, saved.meanLength) : 0,
    style:saved.style === 'brief' ? 'brief' : 'normal',
    mode:saved.mode === 'casual' ? 'casual' : 'adaptive',
  };
}

export function observePiglizaSpeaker(state, text) {
  const language = languageOf(text);
  if (language !== 'unknown') state.language = language;
  state.samples += 1;
  state.meanLength += (text.length - state.meanLength) / state.samples;
  state.style = state.samples >= 3 && state.meanLength <= 9 ? 'brief' : 'normal';
}

export function groundPiglizaTurn(state, text) {
  if (/^(?:别分析(?:我)?|不要心理分析|随便聊聊|闲聊(?:就好)?)[。！!]?$/u.test(text)) {
    state.mode = 'casual';
    return { topic:'聊天方式', reply:'好，猪莉莎切到闲聊。小猪说什么，猪莉莎就接什么。' };
  }
  if (/^(?:可以分析|认真分析|帮我理一理|恢复自动判断)[。！!]?$/u.test(text)) {
    state.mode = 'adaptive';
    return { topic:'聊天方式', reply:'好，猪莉莎恢复自动判断；有明确情绪和困扰时才会认真拆解。' };
  }
  const definition = text.match(/^(?:(?:我们(?:这边|这里|行业里)|我说的)\s*)?([^，。！？?]{1,36}?)(?:是指|指的是)(.{1,160}?)[。！]?$/u)
    || text.match(/^(.{1,36}?) means (.{1,160}?)[.!]?$/iu);
  const question = text.match(/^(.{1,36}?)(?:是什么意思|指的是什么)[？?。]?$/u)
    || text.match(/^what does (.{1,36}?) mean[?？]?$/iu);
  if (!definition && !question) return null;

  const term = (definition || question)[1].trim(), key = keyOf(term);
  const english = languageOf(text) === 'en';
  const index = state.terms.findIndex(item => item.key === key);
  if (question && index < 0) return {
    topic:term, reply:english ? `What does “${term}” mean in your context?` : `“${term}”在小猪这里具体指什么？`,
  };
  const meaning = definition ? definition[2].trim() : state.terms[index].meaning;
  if (definition) {
    if (index >= 0) state.terms.splice(index, 1);
    state.terms.push({ key, term, meaning });
    if (state.terms.length > MAX_TERMS) state.terms.shift();
  }
  return { topic:term, reply:english ? `In your usage, “${term}” means “${meaning}”.`
    : `按小猪的用法，“${term}”指的是“${meaning}”。` };
}

export function languageFallback(state, text) {
  if (state.language !== 'en') return '';
  if (/[?]$/u.test(text)) return 'I may not understand that question reliably yet. Which part should we clarify first?';
  return state.style === 'brief' ? 'Got it. What happened next?' : 'I’m listening. What happened next?';
}
