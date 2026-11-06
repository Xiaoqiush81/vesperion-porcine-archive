const FIXED_REPLACEMENTS = [
  [/爸爸爸爸/g, '粑粑粑粑咪'],
  [/爸爸/g, '粑粑'],
  [/老爸/g, '粑粑'],
  [/不知道/g, '布吉岛'],
  [/吃饭/g, '吃饭饭'],
  [/抱一下/g, '抱抱'],
  [/抱一抱/g, '抱抱'],
  [/贴一下/g, '贴贴'],
  [/贴一贴/g, '贴贴'],
  [/亲一下/g, '亲亲'],
  [/亲一亲/g, '亲亲'],
  [/搓一下/g, '搓搓'],
  [/搓一搓/g, '搓搓'],
  [/小猪/g, '猪咪'],
  [/猪猪/g, '猪咪'],
  [/特别可爱/g, '超萌'],
  [/非常可爱/g, '超萌'],
  [/超级可爱/g, '宇宙无敌第一萌'],
  [/好可爱/g, '好萌'],
  [/可爱/g, '萌'],
  [/特别/g, '超'],
  [/非常/g, '超'],
  [/超级/g, '超'],
];

const PARTICLE_REPLACEMENTS = [
  [/(^|[^不没])了(?=[。！？!?…]|$)/g, '$1惹'],
  [/吧(?=[。！？!?…]|$)/g, '叭'],
];

const PIG_FORMS = {
  light: { prefix:['',''], suffix:['',' ୯(*´ω｀*)୬'], interjection:['咪','嗯哼'] },
  standard: { prefix:['','咪咪—— ','噢哼哼，'], suffix:[' ୯(*´ω｀*)୬',' (ﾟωﾟ)',''], interjection:['咪咪','onk onk','唔咪'] },
  full: { prefix:['咪咪咪—— ','onk onk！','唔咪唔咪—— '], suffix:[' ୯(*´ω｀*)୬',' (ﾟωﾟ)',' onk onk'], interjection:['咪咪咪','onk onk','唔咪','哼哼'] },
};

const SEMANTIC_FORMS = [
  { pattern: /(听不懂|完全没懂|脑子一片空白)/g, replacement: '猪泥' },
  { pattern: /(反应不过来|脑子没转过来|理解得很慢)/g, replacement: '猪脑加载中' },
  { pattern: /(一堆问题|好多问题|满脑子问题)/g, replacement: '一书包问号' },
  { pattern: /(扑过去|撞过去|冲过去抱住)/g, replacement: '肥猪冲击' },
];

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

function replaceSelfReference(text, level) {
  if (level === 'light') return text;
  return text
    .replace(/(^|[，。！？!?、；：\s])我(?=们|自己|的|要|想|觉得|认为|是|有|会|能|可以|今天|刚|又|还|真|超|好|很|也|都|就|不|没|$)/g, '$1猪')
    .replace(/我的/g, '猪的');
}

function applySemanticForms(text, level) {
  if (level !== 'full') return text;
  let output = text;
  SEMANTIC_FORMS.forEach(({ pattern, replacement }) => {
    output = output.replace(pattern, replacement);
  });
  return output;
}

function applyCuteOonk(text, level, seed) {
  if (level !== 'full') return text;
  // "oonk" is not the canonical grunt; it is a deliberately stretched,
  // extra-cute variant of "onk / onk onk".
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
    out = out
      .replace(/哈哈哈+/g, '哼哼哼')
      .replace(/哈哈/g, '哼哼')
      .replace(/打你/g, 'piapia你')
      .replace(/很烦/g, '很凑')
      .replace(/烦人/g, '凑');
  }
  return applyCuteOonk(out, level, seed);
}

export function translateToPorcine(input, level = 'standard') {
  const source = String(input || '').trim();
  if (!source) return '';
  const safeLevel = PIG_FORMS[level] ? level : 'standard';
  let output = source;

  FIXED_REPLACEMENTS.forEach(([pattern, replacement]) => { output = output.replace(pattern, replacement); });
  PARTICLE_REPLACEMENTS.forEach(([pattern, replacement]) => { output = output.replace(pattern, replacement); });
  output = replaceSelfReference(output, safeLevel);
  output = applySemanticForms(output, safeLevel);

  // Established pig-language spellings are canonical and must never be "corrected".
  output = output
    .replace(/臭粑粑/g, '凑粑粑')
    .replace(/臭猪/g, '凑猪')
    .replace(/喵喵/g, '咪咪喵呜');

  return addRhythm(output, safeLevel, hashText(source + safeLevel));
}

export function initPorcineTranslator() {
  const input = document.querySelector('#translatorInput');
  const output = document.querySelector('#translatorOutput');
  const level = document.querySelector('#translatorLevel');
  const run = document.querySelector('#translatorRun');
  const copy = document.querySelector('#translatorCopy');
  const clear = document.querySelector('#translatorClear');

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
