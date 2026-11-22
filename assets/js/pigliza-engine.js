const DEFAULT_MEMORY_SIZE = 12;

const normalizeText = value => String(value ?? '')
  .replace(/[\u0000-\u001f\u007f]/g, ' ')
  .replace(/[ \t]+/g, ' ')
  .trim();

const splitClauses = text => text
  .split(/[。！？!?；;，,\n…]+/u)
  .map(clause => clause.trim())
  .filter(Boolean);

const FOCUS_TRIM = /^(?:我|自己|就是|因为|由于|关于|还有|但是|可是|而且|然后|又|也|很|真的|有点)+|(?:了|呢|啊|呀|吧|惹)+$/gu;

function cleanFocus(value) {
  return normalizeText(value).replace(FOCUS_TRIM, '').replace(/^[“”'"：:、\s]+|[“”'"：:、\s]+$/gu, '');
}

export function reflectPorcinePhrase(value) {
  const swaps = {
    '我自己':'你自己', '你自己':'猪莉莎自己', '我的':'你的', '你的':'猪莉莎的',
    '我们':'你们', '你们':'猪莉莎们', '我是':'你是', '你是':'猪莉莎是',
    '我':'你', '你':'猪莉莎',
  };
  const pattern = new RegExp(Object.keys(swaps).sort((a, b) => b.length - a.length).join('|'), 'gu');
  return normalizeText(value).replace(pattern, match => swaps[match]);
}

function choose(items, last, random) {
  if (!items?.length) return { value:'', index:-1 };
  let index = Math.floor(random() * items.length);
  if (items.length > 1 && index === last) index = (index + 1) % items.length;
  return { value:items[index], index };
}

function findLongestTerm(terms, text) {
  let best = null;
  for (const term of terms || []) {
    if (text.includes(term) && (!best || term.length > best.length)) best = term;
  }
  return best;
}

function focusFromMatch(match, rule, group, term) {
  const indices = rule.focus || Array.from({ length:match.length - 1 }, (_, index) => index + 1);
  for (const index of indices) {
    const focus = cleanFocus(match[index]);
    if (focus && !rule.ignoreFocus?.includes(focus)) return reflectPorcinePhrase(focus);
  }
  return group.topic || term || '这件事';
}

function scoreCandidate(group, rule, clauseIndex, focus, lastGroup) {
  const repeatedTopicPenalty = group.id === lastGroup ? 12 : 0;
  return group.priority * 20 + clauseIndex * 3 + Math.min(focus.length, 12)
    + (rule.weight || 0) - repeatedTopicPenalty;
}

function fillTemplate(template, match, focus) {
  return template
    .replace(/\{focus\}/g, focus)
    .replace(/\{(\d+)\}/g, (_, index) => reflectPorcinePhrase(match[Number(index)] || ''));
}

function bestCandidate(candidates, predicate) {
  let best = null;
  for (const candidate of candidates) {
    if (predicate(candidate) && (!best || candidate.score > best.score)) best = candidate;
  }
  return best;
}

export class PiglizaEngine {
  constructor(data, options = {}) {
    this.data = data;
    this.random = options.random || Math.random;
    this.memorySize = options.memorySize || DEFAULT_MEMORY_SIZE;
    this.groups = [...data.groups].sort((a, b) => b.priority - a.priority);
    this.reset();
  }

  reset() {
    this.memory = [];
    this.lastChoices = {};
    this.lastGroup = null;
    this.quit = false;
  }

  getGreeting() {
    return this.pick('greeting', this.data.greetings).value;
  }

  respond(input) {
    const source = normalizeText(input);
    if (!source) return this.pick('no-input', this.data.noInput).value;

    const farewell = source.replace(/[。！？!?～~\s]+/gu, '');
    if (this.data.quitPhrases.includes(farewell)) {
      this.quit = true;
      return this.pick('farewell', this.data.farewells).value;
    }

    const candidates = [];
    const clauses = splitClauses(source);
    for (let clauseIndex = 0; clauseIndex < clauses.length; clauseIndex += 1) {
      const clause = clauses[clauseIndex];
      for (const group of this.groups) {
        const term = findLongestTerm(group.terms, clause);
        if (group.terms?.length && !term) continue;
        for (let ruleIndex = 0; ruleIndex < group.rules.length; ruleIndex += 1) {
          const rule = group.rules[ruleIndex];
          const match = clause.match(rule.pattern);
          if (!match) continue;
          const focus = focusFromMatch(match, rule, group, term);
          const score = scoreCandidate(group, rule, clauseIndex, focus, this.lastGroup);
          candidates.push({ group, rule, ruleIndex, match, focus, score });
        }
      }
    }

    const deferred = bestCandidate(candidates, candidate => candidate.rule.defer);
    if (deferred) this.remember(this.renderCandidate(deferred));

    const immediate = bestCandidate(candidates, candidate => !candidate.rule.defer);
    if (immediate) {
      this.lastGroup = immediate.group.id;
      return this.renderCandidate(immediate);
    }
    if (!deferred && this.memory.length) return this.memory.shift();
    return this.pick('fallback', this.data.fallbacks).value;
  }

  renderCandidate(candidate) {
    const key = `${candidate.group.id}:${candidate.ruleIndex}`;
    const selected = this.pick(key, candidate.rule.responses);
    return fillTemplate(selected.value, candidate.match, candidate.focus);
  }

  pick(key, items) {
    const selected = choose(items, this.lastChoices[key], this.random);
    this.lastChoices[key] = selected.index;
    return selected;
  }

  remember(reply) {
    if (!reply) return;
    this.memory.push(reply);
    if (this.memory.length > this.memorySize) this.memory.shift();
  }

  getState() {
    return { memory:[...this.memory], lastChoices:{ ...this.lastChoices }, lastGroup:this.lastGroup, quit:this.quit };
  }

  setState(state) {
    if (!state || typeof state !== 'object') return;
    this.memory = Array.isArray(state.memory)
      ? state.memory.filter(value => typeof value === 'string').slice(-this.memorySize)
      : [];
    this.lastChoices = state.lastChoices && typeof state.lastChoices === 'object'
      ? Object.fromEntries(Object.entries(state.lastChoices).filter(([, value]) => Number.isInteger(value)))
      : {};
    this.lastGroup = typeof state.lastGroup === 'string' ? state.lastGroup : null;
    this.quit = Boolean(state.quit);
  }
}
