import {
  PORCINE_LEXICON,
  PORCINE_NORMALIZATIONS,
  getCanonicalPorcineForms,
  getPorcineRules,
} from './porcine-lexicon.js?v=20261107-lexicon-1';

const PARTICLE_REPLACEMENTS = [
  [/(^|[^不没])了(?=[。！？!?…]|$)/g, '$1惹'],
  [/吧(?=[。！？!?…]|$)/g, '叭'],
];

const PIG_FORMS = {
  light: { prefix:['',''], suffix:['',' ୯(*´ω｀*)୬'], interjection:['咪','嗯哼'] },
  standard: { prefix:['','咪咪—— ','噢哼哼，'], suffix:[' ୯(*´ω｀*)୬',' (ﾟωﾟ)',''], interjection:['咪咪','onk onk','唔咪'] },
  full: { prefix:['咪咪咪—— ','onk onk！','唔咪唔咪—— '], suffix:[' ୯(*´ω｀*)୬',' (ﾟωﾟ)',' onk onk'], interjection:['咪咪咪','onk onk','唔咪','哼哼'] },
};

function hashText(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pick(items, seed, offset = 0) {
  return items[(seed + offset) % items.length];
}

function normalizeCanonicalForms(text) {
  return PORCINE_NORMALIZATIONS.reduce(
    (output, [source, replacement]) => output.split(source).join(replacement),
    text,
  );
}

function protectCanonicalForms(text) {
  const forms = [];
  let output = text;
  getCanonicalPorcineForms().forEach(form => {
    const parts = output.split(form);
    if (parts.length === 1) return;
    output = parts.join(`⟦PIG_${forms.push(form) - 1}⟧`);
  });
  return {
    text: output,
    restore(value) {
      return value.replace(/⟦PIG_(\d+)⟧/g, (_, index) => forms[Number(index)] || '');
    },
  };
}

function isNativePorcine(text) {
  return !protectCanonicalForms(text).text
    .replace(/⟦PIG_\d+⟧/g, '')
    .replace(/[\s，。！？!?、；：—…~～（）()୯*´ω｀ﾟ]+/g, '');
}

function applyLexicon(text, level) {
  return getPorcineRules(level).reduce(
    (output, rule) => output.split(rule.source).join(rule.replacement),
    text,
  );
}

function replaceSelfReference(text, level) {
  if (level === 'light') return text;
  return text
    .replace(/(^|[，。！？!?、；：\s])我(?=们|自己|的|要|想|觉得|认为|是|有|会|能|可以|今天|刚|又|还|真|超|好|很|也|都|就|不|没|$)/g, '$1猪')
    .replace(/我的/g, '猪的');
}

function applyCuteOonk(text, level, seed) {
  if (level !== 'full') return text;
  return (seed % 4 === 0) ? text.replace(/onk onk/g, 'oonk') : text;
}

function addRhythm(text, level, seed) {
  if (level === 'light') return text;
  const form = PIG_FORMS[level];
  let out = text;
  let clauseCount = 0;

  out = out.split(/([。！？!?])/).map((part, index) => {
    if (!part || /^[。！？!?]$/.test(part)) return part;
    const trimmed = part.trim();
    if (!trimmed) return part;
    clauseCount += 1;
    if (level === 'full' && clauseCount > 1 && (seed + index) % 3 === 0) {
      return part.replace(trimmed, pick(form.interjection, seed, index) + '，' + trimmed);
    }
    return part;
  }).join('');

  if (!/[୯(]/.test(out)) {
    out = pick(form.prefix, seed, 3) + out + pick(form.suffix, seed, 7);
  }

  if (level === 'full') {
    out = out.replace(/哈哈哈+/g, '哼哼哼').replace(/哈哈/g, '哼哼');
  }
  return applyCuteOonk(out, level, seed);
}

export function translateToPorcine(input, level = 'standard') {
  const source = String(input || '').trim();
  if (!source) return '';

  const safeLevel = PIG_FORMS[level] ? level : 'standard';
  const normalized = normalizeCanonicalForms(source);
  if (isNativePorcine(normalized)) return normalized;

  const protectedInput = protectCanonicalForms(normalized);
  let output = applyLexicon(protectedInput.text, safeLevel);

  PARTICLE_REPLACEMENTS.forEach(([pattern, replacement]) => {
    output = output.replace(pattern, replacement);
  });
  output = replaceSelfReference(output, safeLevel);
  output = addRhythm(output, safeLevel, hashText(normalized + safeLevel));

  return protectedInput.restore(output);
}

function renderLexicon() {
  const root = document.querySelector('#translatorLexicon');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  root.replaceChildren(...PORCINE_LEXICON.map(entry => {
    const item = document.createElement('span');
    const term = document.createElement('b');
    const meaning = document.createElement('small');
    term.textContent = entry.term;
    meaning.textContent = entry.meaning;
    item.append(term, meaning);
    return item;
  }));
}

export function initPorcineTranslator() {
  const input = document.querySelector('#translatorInput');
  const output = document.querySelector('#translatorOutput');
  const level = document.querySelector('#translatorLevel');
  const run = document.querySelector('#translatorRun');
  const copy = document.querySelector('#translatorCopy');
  const clear = document.querySelector('#translatorClear');

  renderLexicon();
  if (!input || !output || !level || !run || !copy || !clear || run.dataset.ready) return;
  run.dataset.ready = 'true';

  const render = value => {
    output.textContent = value || '等待一段人话被猪化……';
    output.classList.toggle('is-empty', !value);
    copy.disabled = !value;
  };

  const translate = () => {
    const translated = translateToPorcine(input.value, level.value);
    render(translated);
    if (!translated) input.focus();
  };

  run.addEventListener('click', translate);
  input.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') translate();
  });

  clear.addEventListener('click', () => {
    input.value = '';
    render('');
    input.focus();
  });

  copy.addEventListener('click', async () => {
    const value = output.textContent.trim();
    if (!value || output.classList.contains('is-empty')) return;
    try {
      await navigator.clipboard.writeText(value);
      copy.textContent = '已复制';
      window.setTimeout(() => { copy.textContent = '复制'; }, 1400);
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(output);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });

  render('');
}
