const MAJOR = [
  ['0', 'THE FOOL', '愚人', '新的开始、自由、信任直觉'],
  ['I', 'THE MAGICIAN', '魔术师', '意志、创造、把可能变成现实'],
  ['II', 'THE HIGH PRIESTESS', '女祭司', '直觉、隐秘、内在知识'],
  ['III', 'THE EMPRESS', '皇后', '丰饶、照料、感官与创造'],
  ['IV', 'THE EMPEROR', '皇帝', '秩序、边界、稳定的权威'],
  ['V', 'THE HIEROPHANT', '教皇', '传统、学习、精神指引'],
  ['VI', 'THE LOVERS', '恋人', '联结、价值选择、真诚一致'],
  ['VII', 'THE CHARIOT', '战车', '意志、自律、向目标推进'],
  ['VIII', 'STRENGTH', '力量', '温柔的勇气、耐心、自我掌控'],
  ['IX', 'THE HERMIT', '隐士', '独处、寻找、内在灯火'],
  ['X', 'WHEEL OF FORTUNE', '命运之轮', '周期、转机、不可控的变化'],
  ['XI', 'JUSTICE', '正义', '因果、公平、清醒的判断'],
  ['XII', 'THE HANGED MAN', '倒吊人', '暂停、换位观看、主动放下'],
  ['XIII', 'DEATH', '死神', '结束、蜕变、为新生腾出位置'],
  ['XIV', 'TEMPERANCE', '节制', '调和、耐心、让差异共存'],
  ['XV', 'THE DEVIL', '恶魔', '束缚、欲望、看见自己的锁链'],
  ['XVI', 'THE TOWER', '高塔', '骤变、真相击穿旧结构'],
  ['XVII', 'THE STAR', '星星', '希望、疗愈、重新相信未来'],
  ['XVIII', 'THE MOON', '月亮', '潜意识、迷雾、沿直觉前行'],
  ['XIX', 'THE SUN', '太阳', '生命力、快乐、坦率的成功'],
  ['XX', 'JUDGEMENT', '审判', '觉醒、回应召唤、重新评价'],
  ['XXI', 'THE WORLD', '世界', '完成、整合、抵达新的整体']
];

const MAJOR_ART = Object.freeze({
  '0':'the-fool.webp','I':'the-magician.webp','II':'the-high-priestess.webp','III':'the-empress.webp','IV':'the-emperor.webp',
  'V':'the-hierophant.webp','VI':'the-lovers.webp','VII':'the-chariot.webp','VIII':'strength.webp','IX':'the-hermit.webp',
  'X':'wheel-of-fortune.webp','XI':'justice.webp','XII':'the-hanged-man.webp','XIII':'death.webp','XIV':'temperance.webp',
  'XV':'the-devil.webp','XVI':'the-tower.webp','XVII':'the-star.webp','XVIII':'the-moon.webp','XIX':'the-sun.webp',
  'XX':'judgement.webp','XXI':'the-world.webp'
});

const MINOR_ART = Object.freeze({
  'wands-1':'wands-ace.webp', 'wands-2':'wands-two.webp', 'wands-3':'wands-three.webp',
  'wands-4':'wands-four.webp', 'wands-5':'wands-five.webp', 'wands-6':'wands-six.webp',
  'wands-7':'wands-seven.webp', 'wands-8':'wands-eight.webp', 'wands-9':'wands-nine.webp', 'wands-10':'wands-ten.webp',
  'wands-11':'wands-page.webp', 'wands-12':'wands-knight.webp', 'wands-13':'wands-queen.webp', 'wands-14':'wands-king.webp',
  'cups-1':'cups-ace.webp', 'cups-2':'cups-two.webp', 'cups-3':'cups-three.webp', 'cups-4':'cups-four.webp',
  'cups-5':'cups-five.webp', 'cups-6':'cups-six.webp', 'cups-7':'cups-seven.webp', 'cups-8':'cups-eight.webp',
  'cups-9':'cups-nine.webp', 'cups-10':'cups-ten.webp',
  'cups-11':'cups-page.webp', 'cups-12':'cups-knight.webp', 'cups-13':'cups-queen.webp', 'cups-14':'cups-king.webp',
  'swords-1':'swords-ace.webp', 'swords-2':'swords-two.webp', 'swords-3':'swords-three.webp',
  'swords-4':'swords-four.webp', 'swords-5':'swords-five.webp', 'swords-6':'swords-six.webp',
  'swords-7':'swords-seven.webp', 'swords-8':'swords-eight.webp', 'swords-9':'swords-nine.webp', 'swords-10':'swords-ten.webp',
  'swords-11':'swords-page.webp', 'swords-12':'swords-knight.webp', 'swords-13':'swords-queen.webp', 'swords-14':'swords-king.webp',
  'pentacles-1':'pentacles-ace.webp', 'pentacles-2':'pentacles-two.webp', 'pentacles-3':'pentacles-three.webp',
  'pentacles-4':'pentacles-four.webp', 'pentacles-5':'pentacles-five.webp', 'pentacles-6':'pentacles-six.webp', 'pentacles-7':'pentacles-seven.webp', 'pentacles-8':'pentacles-eight.webp',
  'pentacles-9':'pentacles-nine.webp', 'pentacles-10':'pentacles-ten.webp?v=20261018-count10',
  'pentacles-11':'pentacles-page.webp', 'pentacles-12':'pentacles-knight.webp?v=20261018-simple', 'pentacles-13':'pentacles-queen.webp', 'pentacles-14':'pentacles-king.webp'
});

const SUITS = [
  ['WANDS', '权杖', '火 · 行动与创造'], ['CUPS', '圣杯', '水 · 情感与关系'],
  ['SWORDS', '宝剑', '风 · 思考与冲突'], ['PENTACLES', '星币', '土 · 物质与养成']
];
const RANKS = ['ACE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN','PAGE','KNIGHT','QUEEN','KING'];

const cards = [
  ...MAJOR.map(([number,title,name,meaning]) => ({ id:`major-${number}`, group:'major', number, title, name, meaning, artwork:MAJOR_ART[number] })),
  ...SUITS.flatMap(([suit,suitCn,element]) => RANKS.map((rank,index) => ({
    id:`${suit.toLowerCase()}-${index+1}`, group:suit.toLowerCase(), number:String(index+1).padStart(2,'0'),
    title:`${rank} OF ${suit}`, name:`${suitCn} · ${rank}`, meaning:element,
    artwork:MINOR_ART[`${suit.toLowerCase()}-${index+1}`]
  })))
];

const RANK_THEMES = [
  '开端、机会、纯粹的能量','平衡、选择、两股力量','发展、协作、初见成果','稳定、守护、暂停整顿',
  '摩擦、失落、迫使改变','恢复、交流、重新取得平衡','考验、评估、选择方向','推进、行动、离开旧局面',
  '接近完成、坚持、独立承担','结果、极致、一个周期的落点','好奇、消息、尚在成长','行动、追逐、把能量带向远方',
  '成熟、照料、从容掌握','主导、责任、让力量稳定落地'
];
const SUIT_THEMES = Object.freeze({
  wands:'行动、热情与创造力', cups:'情感、关系与直觉', swords:'思想、沟通与冲突', pentacles:'金钱、身体与现实积累'
});
const SPREADS = Object.freeze({
  one:['今日指引'],
  three:['现状','阻碍','建议'],
  timeline:['过去','现在','未来'],
  choice:['问题核心','选择 A 的发展','选择 A 的代价','选择 B 的发展','选择 B 的代价'],
  relationship:['我的状态','对方状态','我如何看待关系','对方如何看待关系','隐藏的联结','关系建议'],
  horseshoe:['过去','现在','隐藏影响','主要阻碍','外界环境','建议','可能结果'],
  celtic:['核心现状','交叉挑战','意识目标','深层根源','近期过去','近期未来','自我位置','外界影响','希望与恐惧','最终趋势'],
  study:['猪现在怎么了','真正的断点','猪以为的断点','今天最小的动作','行动后的变化']
});

const RANK_REVERSED = [
  '能量尚未落地、机会被忽略','犹疑、失衡、迟迟无法选择','协作受阻、计划仍欠成熟','停滞、抓得太紧、拒绝变化',
  '困在失落里、冲突消耗过度','恢复延迟、关系失衡','逃避考验、判断摇摆','方向混乱、行动受阻',
  '疲惫、防御过度、接近极限','周期难以收尾、结果失衡','消息延迟、不够成熟','冲动、失速、把力气用错方向',
  '照料失衡、过度内耗','控制过度、责任失序'
];

const MAJOR_REVERSED = Object.freeze({
  '0':'冒进、迟疑，或不敢踏出第一步','I':'能力受阻、意图分散，或操控欲','II':'忽视直觉、秘密浮现、内在噪声','III':'创造受阻、过度付出、忽略自己',
  'IV':'控制过度、秩序僵化、权威失衡','V':'盲从或反叛传统，需要重新辨认信念','VI':'价值错位、关系失衡、选择迟疑','VII':'失去方向、强行推进、自律松动',
  'VIII':'自我怀疑、情绪失控、力量内耗','IX':'封闭、逃避陪伴，或尚未找到答案','X':'抗拒变化、坏循环、时机延迟','XI':'不公、逃避责任、判断偏斜',
  'XII':'无谓牺牲、拖延、拒绝换个角度','XIII':'抗拒结束、转变停滞、旧事纠缠','XIV':'失衡、过量、缺少耐心与调和','XV':'看见束缚、开始松绑，或沉溺加深',
  'XVI':'回避崩塌、余震未止、改变发生在内部','XVII':'失望、信念变弱、疗愈尚未抵达','XVIII':'迷雾加深、焦虑投射，或真相渐显','XIX':'快乐受阻、过度乐观、光芒暂被遮住',
  'XX':'拒绝召唤、自我否定、旧评价仍在回响','XXI':'未竟之事、延迟完成、缺少最后整合'
});

function practiceMeaning(card) {
  if (card.group === 'major') return card.meaning;
  const index = Math.max(0, Number(card.number) - 1);
  return `${SUIT_THEMES[card.group]}；${RANK_THEMES[index]}`;
}

function readingMeaning(card, reversed) {
  if (!reversed) return practiceMeaning(card);
  if (card.group === 'major') return MAJOR_REVERSED[card.number] || `能量内化或受阻：${card.meaning}`;
  const index = Math.max(0, Number(card.number) - 1);
  return `${SUIT_THEMES[card.group]}；${RANK_REVERSED[index]}`;
}

const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

export function createTarotCabinet() {
  const grid = document.querySelector('#tarotGrid');
  const tabs = document.querySelector('#tarotTabs');
  const progress = document.querySelector('#tarotProgress');
  const revealButton = document.querySelector('#revealTarot');
  const dialog = document.querySelector('#tarotDialog');
  const content = document.querySelector('#tarotDialogContent');
  const spreadPicker = document.querySelector('#spreadPicker');
  const drawButton = document.querySelector('#drawTarot');
  const resetButton = document.querySelector('#resetTarot');
  const readingTable = document.querySelector('#readingTable');
  const readingNotes = document.querySelector('#readingNotes');
  const readingJournal = document.querySelector('#readingJournal');
  const practiceStatus = document.querySelector('#practiceStatus');
  const reversalToggle = document.querySelector('#reversalToggle');
  const customCountWrap = document.querySelector('#customCountWrap');
  const customCount = document.querySelector('#customCount');
  const readingExtras = document.querySelector('#readingExtras');
  const clarifierButton = document.querySelector('#drawClarifier');
  const bottomButton = document.querySelector('#showBottomCard');
  const saveButton = document.querySelector('#saveReading');
  const saveStatus = document.querySelector('#saveReadingStatus');
  const historyCount = document.querySelector('#historyCount');
  const historyList = document.querySelector('#historyList');
  const questionInput = document.querySelector('#tarotQuestion');
  let group = 'major';
  let spread = 'one';
  let drawing = false;
  let activeReading = null;
  let remainingDeck = [];
  let bottomCard = null;
  const revealed = new Set();
  const groups = [
    ['major','第一批 · 大阿尔卡那 22 张'],
    ['wands','第二批 · 权杖 14 张'],
    ['cups','第三批 · 圣杯 14 张'],
    ['swords','第四批 · 宝剑 14 张'],
    ['pentacles','第五批 · 星币 14 张']
  ];

  tabs.innerHTML = groups.map(([id,label],i) => `<button class="tarot-tab ${i ? '' : 'active'}" data-group="${id}">${label}</button>`).join('');
  function render() {
    const visible = cards.filter(card => group === 'all' || card.group === group);
    grid.innerHTML = visible.map(card => `<button class="tarot-card ${card.artwork ? 'is-collected' : 'is-pending'} ${revealed.has(card.id) ? 'is-revealed' : ''}" data-id="${escape(card.id)}" type="button" aria-label="${revealed.has(card.id) ? `查看${escape(card.name)}详情` : `翻开${escape(card.name)}`}">
      <span class="tarot-art"><span class="tarot-card-inner"><span class="tarot-face tarot-back"><img src="assets/tarot/card-back.webp?v=2651" alt="" width="320" height="480" loading="lazy" decoding="async"></span><span class="tarot-face tarot-front">${card.artwork ? `<img src="assets/tarot/${escape(card.artwork)}?v=pentacles-two-tone-20261019" alt="${escape(card.name)}牌面" width="320" height="480" loading="lazy" decoding="async" fetchpriority="low">` : `<span class="tarot-placeholder"><b>${escape(card.number)}</b><i>VESPERION</i><span>馆藏空位</span></span>`}</span></span></span>
      <span class="tarot-meta"><small>${card.group === 'major' ? 'MAJOR ARCANA' : card.group.toUpperCase()}</small><b>${escape(card.name)}</b><em>${escape(card.title)}</em></span>
    </button>`).join('');
    const collected = visible.filter(card => card.artwork).length;
    progress.textContent = `COLLECTED ${collected} / ${visible.length}`;
  }
  function open(id) {
    const card = cards.find(item => item.id === id);
    if (!card?.artwork) return;
    content.innerHTML = `<div class="tarot-detail"><figure class="tarot-detail-art"><img src="assets/tarot/${escape(card.artwork)}?v=restored-originals-batch-major" alt="${escape(card.name)}牌面" width="768" height="1152" decoding="async"></figure><div><p class="eyebrow">${escape(card.number)} · ${card.group === 'major' ? 'MAJOR ARCANA' : card.group.toUpperCase()}</p><h2>${escape(card.name)}</h2><p class="tarot-english">${escape(card.title)}</p><p>${escape(card.meaning)}</p></div></div>`;
    dialog.showModal();
  }
  tabs.addEventListener('click', event => {
    const button = event.target.closest('.tarot-tab'); if (!button) return;
    group = button.dataset.group;
    tabs.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button)); render();
  });
  grid.addEventListener('click', event => {
    const button = event.target.closest('.tarot-card');
    const id = button?.dataset.id;
    if (!id || button.classList.contains('is-pending')) return;
    if (!revealed.has(id)) {
      revealed.add(id);
      button.classList.add('is-revealed');
      button.setAttribute('aria-label', `查看${cards.find(card => card.id === id)?.name || ''}详情`);
      return;
    }
    open(id);
  });
  revealButton.addEventListener('click', () => {
    const visible = cards.filter(card => (group === 'all' || card.group === group) && card.artwork);
    const allOpen = visible.every(card => revealed.has(card.id));
    visible.forEach(card => allOpen ? revealed.delete(card.id) : revealed.add(card.id));
    revealButton.textContent = allOpen ? '全部翻开' : '全部盖回';
    render();
  });
  dialog.querySelector('.tarot-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

  function randomIndex(max) {
    if (globalThis.crypto?.getRandomValues) {
      const value = new Uint32Array(1); globalThis.crypto.getRandomValues(value); return value[0] % max;
    }
    return Math.floor(Math.random() * max);
  }
  function shuffledDeck() {
    const pool = cards.filter(card => card.artwork).slice();
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swap = randomIndex(index + 1);
      [pool[index], pool[swap]] = [pool[swap], pool[index]];
    }
    return pool;
  }
  function orient(card, reversals = reversalToggle.checked) {
    return { card, reversed: Boolean(reversals && randomIndex(2)) };
  }
  function readingCardMarkup(item, position, index, extra = false) {
    const orientation = item.reversed ? '逆位' : '正位';
    return `<article class="draw-slot ${extra ? 'is-extra' : ''}" data-draw-index="${index}">
      <p class="draw-position">${escape(position)}</p>
      <button class="draw-card" type="button" aria-label="翻开${escape(position)}牌">
        <span class="draw-card-inner"><span class="draw-face draw-back" aria-hidden="true"><img src="assets/tarot/card-back.webp?v=2651" alt="" width="320" height="480" decoding="async"></span><span class="draw-face draw-front"><img class="${item.reversed ? 'reversed-art' : ''}" src="assets/tarot/${escape(item.card.artwork)}?v=pentacles-two-tone-20261019" alt="" width="320" height="480" decoding="async"></span></span>
      </button>
      <span class="draw-hint">点击翻牌</span>
      <p class="draw-meaning"><b>${escape(item.card.name)} · ${escape(item.card.title)} <em>${orientation}</em></b>${escape(readingMeaning(item.card, item.reversed))}</p>
    </article>`;
  }
  function clearReading(message = '牌组安静地等待着。') {
    readingTable.className = 'reading-table';
    readingTable.innerHTML = '';
    readingNotes.hidden = true;
    readingJournal.value = '';
    readingExtras.hidden = true;
    activeReading = null;
    remainingDeck = [];
    bottomCard = null;
    clarifierButton.disabled = false;
    bottomButton.disabled = false;
    saveStatus.textContent = '';
    resetButton.disabled = true;
    practiceStatus.textContent = message;
    drawing = false;
  }
  function deal() {
    if (drawing) return;
    drawing = true;
    drawButton.disabled = true;
    saveButton.disabled = false;
    saveStatus.textContent = '';
    readingNotes.hidden = true;
    readingTable.className = 'reading-table has-cards';
    readingTable.innerHTML = '';
    practiceStatus.textContent = '正在洗牌……请把注意力留在问题上。';
    const positions = spread === 'custom'
      ? Array.from({ length: Math.min(12, Math.max(1, Number(customCount.value) || 1)) }, (_, index) => `第 ${index + 1} 张`)
      : SPREADS[spread];
    const deck = shuffledDeck();
    const selected = deck.splice(0, positions.length).map(card => orient(card, reversalToggle.checked));
    bottomCard = deck.pop();
    remainingDeck = deck;
    activeReading = { spread, positions, cards:selected, extras:[], reversals:reversalToggle.checked, question:questionInput.value.trim(), createdAt:new Date().toISOString() };
    window.setTimeout(() => {
      readingTable.dataset.size = String(selected.length);
      readingTable.innerHTML = selected.map((item, index) => readingCardMarkup(item, positions[index], index)).join('');
      practiceStatus.textContent = `已抽取 ${selected.length} 张。按自己的节奏逐张翻开。`;
      resetButton.disabled = false;
      drawButton.disabled = false;
      drawing = false;
    }, 620);
  }
  spreadPicker.addEventListener('click', event => {
    const button = event.target.closest('.spread-choice'); if (!button || drawing) return;
    spread = button.dataset.spread;
    spreadPicker.querySelectorAll('.spread-choice').forEach(item => item.classList.toggle('active', item === button));
    customCountWrap.hidden = spread !== 'custom';
    clearReading(`已选择「${button.querySelector('b').textContent}」。`);
  });
  drawButton.addEventListener('click', deal);
  resetButton.addEventListener('click', () => clearReading('本次牌阵已收起，可以带着新问题再次洗牌。'));
  readingTable.addEventListener('click', event => {
    const button = event.target.closest('.draw-card'); if (!button || button.classList.contains('revealed')) return;
    button.classList.add('revealed');
    button.closest('.draw-slot').classList.add('is-revealed');
    button.nextElementSibling.textContent = '已翻开';
    const left = readingTable.querySelectorAll('.draw-card:not(.revealed)').length;
    practiceStatus.textContent = left ? `还有 ${left} 张牌没有翻开。` : '牌阵已经完整显现。现在试着把它们串成一句话。';
    if (!left) {
      readingNotes.hidden = false;
      readingExtras.hidden = false;
    }
  });
  clarifierButton.addEventListener('click', () => {
    if (!activeReading || !remainingDeck.length) return;
    const item = orient(remainingDeck.shift(), activeReading.reversals);
    activeReading.extras.push({ ...item, position:'解释牌' });
    readingTable.insertAdjacentHTML('beforeend', readingCardMarkup(item, '解释牌', activeReading.positions.length + activeReading.extras.length - 1, true));
    clarifierButton.disabled = true;
    readingNotes.hidden = true;
    practiceStatus.textContent = '补牌已经落下；翻开它，看看它解释了哪一处疑惑。';
  });
  bottomButton.addEventListener('click', () => {
    if (!activeReading || !bottomCard) return;
    const item = orient(bottomCard, activeReading.reversals);
    activeReading.extras.push({ ...item, position:'牌堆底牌' });
    readingTable.insertAdjacentHTML('beforeend', readingCardMarkup(item, '牌堆底牌', activeReading.positions.length + activeReading.extras.length - 1, true));
    bottomButton.disabled = true;
    bottomCard = null;
    readingNotes.hidden = true;
    practiceStatus.textContent = '底牌代表没有明说、却一直影响问题的潜在能量。';
  });
  function getHistory() {
    try { return JSON.parse(localStorage.getItem('vesperion-tarot-history') || '[]'); }
    catch { return []; }
  }
  function renderHistory() {
    const history = getHistory();
    historyCount.textContent = history.length;
    historyList.innerHTML = history.length ? history.map(entry => `<article><time>${escape(new Intl.DateTimeFormat('zh-CN', { dateStyle:'medium', timeStyle:'short' }).format(new Date(entry.createdAt)))}</time><b>${escape(entry.question || '未命名的问题')}</b><p>${escape(entry.cards.map(item => `${item.name}${item.reversed ? '（逆）' : ''}`).join(' · '))}</p>${entry.note ? `<small>${escape(entry.note)}</small>` : ''}</article>`).join('') : '<p class="history-empty">还没有记录。第一场正式占卜会留在这里。</p>';
  }
  saveButton.addEventListener('click', () => {
    if (!activeReading) return;
    const history = getHistory();
    history.unshift({
      createdAt:activeReading.createdAt, question:activeReading.question, spread:activeReading.spread,
      cards:[
        ...activeReading.cards.map((item, index) => ({ ...item, position:activeReading.positions[index] })),
        ...activeReading.extras
      ].map(item => ({ name:item.card.name, title:item.card.title, reversed:item.reversed, position:item.position || '' })),
      note:readingJournal.value.trim()
    });
    localStorage.setItem('vesperion-tarot-history', JSON.stringify(history.slice(0, 20)));
    saveStatus.textContent = '已经收进记录册。';
    saveButton.disabled = true;
    renderHistory();
  });
  reversalToggle.addEventListener('change', () => {
    practiceStatus.textContent = reversalToggle.checked ? '逆位已经启用；牌会随机选择正位或逆位。' : '逆位已经关闭；本次只使用正位。';
  });
  renderHistory();
  render();
}

