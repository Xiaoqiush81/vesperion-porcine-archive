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

const SUITS = [
  ['WANDS', '权杖', '火 · 行动与创造'], ['CUPS', '圣杯', '水 · 情感与关系'],
  ['SWORDS', '宝剑', '风 · 思考与冲突'], ['PENTACLES', '星币', '土 · 物质与养成']
];
const RANKS = ['ACE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN','PAGE','KNIGHT','QUEEN','KING'];

const cards = [
  ...MAJOR.map(([number,title,name,meaning]) => ({ id:`major-${number}`, group:'major', number, title, name, meaning, artwork:MAJOR_ART[number] })),
  ...SUITS.flatMap(([suit,suitCn,element]) => RANKS.map((rank,index) => ({
    id:`${suit.toLowerCase()}-${index+1}`, group:suit.toLowerCase(), number:String(index+1).padStart(2,'0'),
    title:`${rank} OF ${suit}`, name:`${suitCn} · ${rank}`, meaning:element
  })))
];

const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

export function createTarotCabinet() {
  const grid = document.querySelector('#tarotGrid');
  const tabs = document.querySelector('#tarotTabs');
  const progress = document.querySelector('#tarotProgress');
  const dialog = document.querySelector('#tarotDialog');
  const content = document.querySelector('#tarotDialogContent');
  let group = 'all';
  const groups = [['all','全部 78'],['major','大阿尔卡那'],...SUITS.map(([suit,cn]) => [suit.toLowerCase(),cn])];

  tabs.innerHTML = groups.map(([id,label],i) => `<button class="tarot-tab ${i ? '' : 'active'}" data-group="${id}">${label}</button>`).join('');
  function render() {
    const visible = cards.filter(card => group === 'all' || card.group === group);
    grid.innerHTML = visible.map(card => `<button class="tarot-card ${card.artwork ? 'is-collected' : 'is-pending'}" data-id="${escape(card.id)}" type="button">
      <span class="tarot-art">${card.artwork ? `<img src="assets/tarot/${escape(card.artwork)}" alt="${escape(card.name)}牌面" loading="lazy">` : `<span class="tarot-placeholder"><b>${escape(card.number)}</b><i>VESPERION</i><span>馆藏空位</span></span>`}</span>
      <span class="tarot-meta"><small>${card.group === 'major' ? 'MAJOR ARCANA' : card.group.toUpperCase()}</small><b>${escape(card.name)}</b><em>${escape(card.title)}</em></span>
    </button>`).join('');
    const collected = visible.filter(card => card.artwork).length;
    progress.textContent = `COLLECTED ${collected} / ${visible.length}`;
  }
  function open(id) {
    const card = cards.find(item => item.id === id);
    if (!card?.artwork) return;
    content.innerHTML = `<div class="tarot-detail"><img src="assets/tarot/${escape(card.artwork)}" alt="${escape(card.name)}牌面"><div><p class="eyebrow">${escape(card.number)} · ${card.group === 'major' ? 'MAJOR ARCANA' : card.group.toUpperCase()}</p><h2>${escape(card.name)}</h2><p class="tarot-english">${escape(card.title)}</p><p>${escape(card.meaning)}</p></div></div>`;
    dialog.showModal();
  }
  tabs.addEventListener('click', event => {
    const button = event.target.closest('.tarot-tab'); if (!button) return;
    group = button.dataset.group;
    tabs.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button)); render();
  });
  grid.addEventListener('click', event => open(event.target.closest('.tarot-card')?.dataset.id));
  dialog.querySelector('.tarot-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  render();
}
