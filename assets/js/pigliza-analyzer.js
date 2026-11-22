const CONTROL = /[\u0000-\u001f\u007f]/gu;
const EDGE_NOISE = /^(?:我觉得|我认为|我感觉|感觉自己|觉得自己|都觉得|觉得|认为|所有人|主要是|其实是|说的是|已经不|不再|没那么|我|自己|自我|就是|因为|由于|关于|还有|但是|可是|而且|然后|又|也|都|很|真的|有点|最近|今天|现在|对|被)+|(?:让我|使我|感觉|觉得|好大|很大|太大|了|呢|啊|呀|吧|惹)+$/gu;
const EMPTY_TOPICS = new Set(['','自己','自我','这','这个','事情','感觉','好大','很大','太大']);
const CONTINUATION = /^(?:主要是|就是|其实是|说的是|至于|它|这件事|那件事|这个|那个)/u;
const REFERENCE = /^(?:它|这件事|那件事|这个|那个)/u;
const GENERIC_TOPICS = new Set(['它','这','这个','那','那个','这件事','那件事']);
const SENTENCE_SEGMENTER = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('zh-CN', { granularity:'sentence' }) : null;

export const normalizePiglizaText = value => String(value ?? '').replace(CONTROL, ' ').replace(/[ \t]+/g, ' ').trim();

export function reflectPorcinePhrase(value) {
  const swaps = { '我自己':'你自己', '你自己':'猪莉莎自己', '我的':'你的', '你的':'猪莉莎的', '我们':'你们', '你们':'猪莉莎们', '我是':'你是', '你是':'猪莉莎是', '我':'你', '你':'猪莉莎' };
  const pattern = new RegExp(Object.keys(swaps).sort((a, b) => b.length - a.length).join('|'), 'gu');
  return normalizePiglizaText(value).replace(pattern, match => swaps[match]);
}

function sentenceParts(text) {
  if (SENTENCE_SEGMENTER) return [...SENTENCE_SEGMENTER.segment(text)].map(item => item.segment);
  return text.split(/[。！？!?\n]+/u);
}

export function splitPiglizaClauses(text) {
  return sentenceParts(normalizePiglizaText(text)).flatMap(sentence => sentence.split(/[，,；;…]+/u))
    .map(clause => clause.replace(/^[。！？!?\s]+|[。！？!?\s]+$/gu, '').trim()).filter(Boolean);
}

function validTerm(text, term, index) { return !(term === '困' && text[index + 1] === '难'); }

function findTerms(text, items) {
  const matches = [];
  for (const item of items) for (const term of item.terms || item.markers || []) {
    const index = text.indexOf(term);
    if (index >= 0 && validTerm(text, term, index)) matches.push({ ...item, term, index });
  }
  return matches.sort((a, b) => b.priority - a.priority || b.term.length - a.term.length || a.index - b.index);
}

function cleanTopic(value) {
  const topic = normalizePiglizaText(value).replace(/^[“”'"：:、\s]+|[“”'"：:、\s]+$/gu, '')
    .replace(EDGE_NOISE, '').replace(/^(?:这份|这种)|(?:这件事)$/gu, '').trim();
  return EMPTY_TOPICS.has(topic) ? '' : topic;
}

function topicAround(text, match) {
  const before = cleanTopic(text.slice(0, match.index));
  const after = cleanTopic(text.slice(match.index + match.term.length));
  if (before.endsWith('的')) return `${before}${match.term}`;
  return after && !/^(?:好|大|小|多|少|重|严重)$/u.test(after) ? after : before;
}

function conceptNegated(text, concept) {
  if (!concept) return false;
  const before = text.slice(Math.max(0, concept.index - 5), concept.index);
  return /(?:不|没|没有|不再|已经不|没那么)$/u.test(before);
}

function frameScore(frame) {
  return (frame.primary?.priority || 0) * 20 + (frame.act?.priority || 0) * 8 + frame.index * 3 + Math.min(frame.topic.length, 12) + frame.intensity * 2;
}

export function analyzePiglizaText(source, data) {
  const text = normalizePiglizaText(source);
  const frames = splitPiglizaClauses(text).map((clause, index) => {
    const concepts = findTerms(clause, data.concepts), acts = findTerms(clause, data.acts);
    const primary = concepts[0] || null, act = acts[0] || null;
    const negated = conceptNegated(clause, primary);
    const context = primary?.kind === 'affect' ? concepts.find(item => ['context','relation'].includes(item.kind)) : null;
    const around = primary ? topicAround(clause, primary) : '';
    const usableAround = !negated && around && !/(?:不知道|为什么|让我|使我)/u.test(around);
    const rawTopic = usableAround ? around : context?.term
      || (negated ? primary?.topic : around)
      || (primary ? (primary.term.length >= 4 ? primary.term : primary.topic) : act ? cleanTopic(clause.slice(act.index + act.term.length)) : '');
    const continuation = CONTINUATION.test(clause);
    const frame = { text:clause, index, concepts:concepts.map(({ id, term }) => ({ id, term })), primary, act,
      acts:acts.map(({ id }) => id), topic:reflectPorcinePhrase(rawTopic || primary?.term || primary?.topic || ''),
      negated, continuation, continuationTopic:continuation && !REFERENCE.test(clause) ? reflectPorcinePhrase(cleanTopic(clause.replace(CONTINUATION, ''))) : '',
      intensity:(clause.match(/非常|特别|太|超级|真的|极其|越来越/gu) || []).length,
    };
    return { ...frame, score:frameScore(frame) };
  }).sort((a, b) => b.score - a.score);
  return { text, frames, primary:frames[0] || null };
}

export function contextualizePiglizaAnalysis(analysis, context, data) {
  if (!context) return analysis;
  const inherited = data.concepts.find(concept => concept.id === context.concept);
  const frames = analysis.frames.map(frame => {
    if (!frame.continuation && !GENERIC_TOPICS.has(frame.topic)) return frame;
    const primary = frame.primary || inherited || null;
    const topic = frame.continuationTopic || context.topic || frame.topic;
    return { ...frame, primary, topic, score:frame.score + (primary?.priority || 0) * 10 + 12 };
  }).sort((a, b) => b.score - a.score);
  return { ...analysis, frames, primary:frames[0] || null };
}

export function compactFrame(frame) {
  if (!frame) return null;
  return { text:frame.text.slice(0,180), topic:frame.topic.slice(0,80), concept:frame.primary?.id || null, act:frame.act?.id || null, salience:Math.round(frame.score) };
}
