const DEFAULT_MEMORY_SIZE = 12;

const normalizeText = value => String(value ?? '')
  .replace(/[\u0000-\u001f\u007f]/g, ' ')
  .replace(/[ \t]+/g, ' ')
  .trim();

const splitSentences = text => text
  .split(/[。！？!?；;\n]+/u)
  .map(sentence => sentence.trim())
  .filter(Boolean);

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

function fillTemplate(template, match) {
  return template.replace(/\{(\d+)\}/g, (_, index) => reflectPorcinePhrase(match[Number(index)] || ''));
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

    let deferred = false;
    for (const sentence of splitSentences(source)) {
      for (const group of this.groups) {
        if (group.terms?.length && !group.terms.some(term => sentence.includes(term))) continue;
        for (let ruleIndex = 0; ruleIndex < group.rules.length; ruleIndex += 1) {
          const rule = group.rules[ruleIndex];
          const match = sentence.match(rule.pattern);
          if (!match) continue;
          const key = `${group.id}:${ruleIndex}`;
          const selected = this.pick(key, rule.responses);
          const reply = fillTemplate(selected.value, match);
          if (rule.defer) {
            this.remember(reply);
            deferred = true;
            continue;
          }
          return reply;
        }
      }
    }

    if (!deferred && this.memory.length) return this.memory.shift();
    return this.pick('fallback', this.data.fallbacks).value;
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
    return { memory:[...this.memory], lastChoices:{ ...this.lastChoices }, quit:this.quit };
  }

  setState(state) {
    if (!state || typeof state !== 'object') return;
    this.memory = Array.isArray(state.memory)
      ? state.memory.filter(value => typeof value === 'string').slice(-this.memorySize)
      : [];
    this.lastChoices = state.lastChoices && typeof state.lastChoices === 'object'
      ? Object.fromEntries(Object.entries(state.lastChoices).filter(([, value]) => Number.isInteger(value)))
      : {};
    this.quit = Boolean(state.quit);
  }
}
