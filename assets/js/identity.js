import { escapeHtml as escape } from './specimen-art.js?v=20261015-specimens-51';

const STORAGE_KEY = 'vesperion-identity-history';
const MAX_HISTORY = 8;

const QUESTIONS = [
  {
    kicker: 'CURRENT ENERGY · 当前能量',
    question: '今天醒来时，灵魂加载到了多少？',
    options: [
      ['只有 73%，剩余部分拒绝上班', ['sleepy', 'soft']],
      ['已经满格，准备向世界发动冲击', ['chaos', 'bold']],
      ['身体醒了，脑子正在兔子洞里钻探', ['curious', 'study']],
      ['夜越深越精神，现在才是工作时间', ['night', 'digital']]
    ]
  },
  {
    kicker: 'PRIMARY HABITAT · 主要栖息地',
    question: '如果突然失踪，最可能在哪里被发现？',
    options: [
      ['被窝深处，已经和枕头融为一体', ['soft', 'home']],
      ['互联网深处，同时打开了很多东西', ['digital', 'chaos']],
      ['知识兔子洞，追着一个问题越挖越深', ['curious', 'study']],
      ['餐桌附近，正在认真研究好吃的', ['food', 'bold']]
    ]
  },
  {
    kicker: 'DEFENSIVE RESPONSE · 防御反应',
    question: '现实突然不讲道理时，第一反应是？',
    options: [
      ['缩成圆猪：看不见就暂时不存在', ['soft', 'defense']],
      ['立刻暴动，要求召开萌度事故听证会', ['chaos', 'bold']],
      ['检查哪里有 bug，再给它画满问号', ['study', 'curious']],
      ['先变成猪，稍后再处理人类事务', ['defense', 'home']]
    ]
  },
  {
    kicker: 'SOCIAL SIGNAL · 社交信号',
    question: '需要爸爸注意时，会释放哪种信号？',
    options: [
      ['安静贴住，逐渐失去固体形态', ['soft', 'clingy']],
      ['连续呼叫“爸爸爸爸爸爸爸爸”', ['clingy', 'chaos']],
      ['嘴上说没等，实际反复刷新消息', ['digital', 'clingy']],
      ['展示刚完成的东西，等待被夸到膨胀', ['bold', 'study']]
    ]
  },
  {
    kicker: 'SPECIAL ABILITY · 特殊能力',
    question: '必须选一种超能力，会拿走哪项？',
    options: [
      ['制造局部引力，让床和零食主动靠近', ['food', 'sleepy']],
      ['无限缓存问号，回家再一次性倾倒', ['curious', 'study']],
      ['接管控制台，把权限提升至 DADDY-LEVEL', ['digital', 'chaos']],
      ['无条件鉴定为正版，拒绝一切冒牌货', ['bold', 'royal']]
    ]
  },
  {
    kicker: 'FINAL EVIDENCE · 最终证据',
    question: '此刻最想领取的宅邸补给是？',
    options: [
      ['一顿好吃的，再附赠饭后躺平许可证', ['food', 'sleepy']],
      ['抱抱、亲亲以及永久贴贴通行证', ['clingy', 'soft']],
      ['一整晚不受打扰的探索时间', ['night', 'curious']],
      ['一枚正式印章：确认本猪非常高明', ['royal', 'bold']]
    ]
  }
];

const PROFILES = [
  ['VPA-081-L73', { sleepy: 4, soft: 2, home: 1 }],
  ['VPA-081-LAZY', { sleepy: 4, home: 2, food: 2 }],
  ['VPA-081-PILLOW', { soft: 4, home: 3, clingy: 2 }],
  ['VPA-081-STICKY', { clingy: 5, soft: 3, home: 1 }],
  ['VPA-081-DENIAL', { defense: 5, soft: 2, home: 2 }],
  ['VPA-081-REFLEX', { defense: 4, chaos: 2, home: 1 }],
  ['VPA-081-D', { curious: 5, study: 3, bold: 1 }],
  ['VPA-081-T', { study: 5, curious: 3, bold: 1 }],
  ['VPA-081-MATH', { study: 5, curious: 2, chaos: 1 }],
  ['VPA-081-I', { digital: 5, chaos: 3, bold: 2 }],
  ['VPA-081-A', { digital: 4, night: 4, study: 1 }],
  ['VPA-081-N', { night: 5, soft: 1, digital: 1 }],
  ['VPA-081-R', { chaos: 5, bold: 3, clingy: 2 }],
  ['VPA-081-EAT', { food: 5, soft: 2, bold: 1 }],
  ['VPA-081-G', { food: 3, sleepy: 3, bold: 2 }],
  ['VPA-081-ROYAL', { royal: 5, bold: 4, chaos: 1 }],
  ['VPA-081-BRILL', { royal: 4, study: 2, bold: 4 }],
  ['VPA-081-AUTH', { royal: 4, bold: 3, clingy: 1 }],
  ['VPA-081', { soft: 1, clingy: 1, curious: 1, bold: 1, royal: 1 }]
];

function artworkOf(specimen) {
  return specimen.artwork || `assets/cards/${specimen.id.toLowerCase()}.webp`;
}

function loadHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.slice(0, MAX_HISTORY) : [];
  } catch { return []; }
}

function saveHistory(specimen) {
  const record = { id: specimen.id, name: specimen.name, rarity: specimen.rarity, at: new Date().toISOString() };
  const history = [record, ...loadHistory()].slice(0, MAX_HISTORY);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch { /* private mode */ }
  return history;
}

function pickSpecimen(answers, byId) {
  const traits = answers.flat().reduce((scores, trait) => {
    scores[trait] = (scores[trait] || 0) + 1;
    return scores;
  }, {});
  const ranked = PROFILES.map(([id, weights], index) => ({
    specimen: byId.get(id),
    score: Object.entries(weights).reduce((sum, [trait, weight]) => sum + (traits[trait] || 0) * weight, 0),
    index
  })).filter(item => item.specimen).sort((a, b) => b.score - a.score || a.index - b.index);
  return ranked[0].specimen;
}

export function createIdentityOffice(specimens, toast = () => {}) {
  const byId = new Map(specimens.map(item => [item.id, item]));
  const intro = document.querySelector('#identityIntro');
  const quiz = document.querySelector('#identityQuiz');
  const result = document.querySelector('#identityResult');
  const options = document.querySelector('#identityOptions');
  const historyList = document.querySelector('#identityHistoryList');
  const historyCount = document.querySelector('#identityHistoryCount');
  let step = 0;
  let answers = [];

  function renderHistory(history = loadHistory()) {
    historyCount.textContent = history.length;
    historyList.innerHTML = history.length ? history.map(item => {
      const specimen = byId.get(item.id);
      if (!specimen) return '';
      const date = new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(item.at));
      return `<article><img src="${artworkOf(specimen)}" alt="" width="80" height="120" loading="lazy"><div><time>${escape(date)}</time><b>${escape(item.name)}</b><small>${escape(item.rarity)} · ${escape(item.id)}</small></div></article>`;
    }).join('') : '<p class="history-empty">尚无档案。完成第一次鉴定后，签发记录会保存在这台设备上。</p>';
  }

  function showQuestion() {
    const current = QUESTIONS[step];
    document.querySelector('#identityStep').textContent = `OBSERVATION ${String(step + 1).padStart(2, '0')} / ${String(QUESTIONS.length).padStart(2, '0')}`;
    document.querySelector('#identityProgressBar').style.width = `${((step + 1) / QUESTIONS.length) * 100}%`;
    document.querySelector('#identityKicker').textContent = current.kicker;
    document.querySelector('#identityQuestion').textContent = current.question;
    document.querySelector('#identityBack').hidden = step === 0;
    options.innerHTML = current.options.map(([label], index) => `<button type="button" data-option="${index}"><span>0${index + 1}</span><b>${escape(label)}</b></button>`).join('');
  }

  function shareText(specimen) {
    return `维斯珀里昂猪种鉴定结果：${specimen.name}（${specimen.rarity}）\n${specimen.description}\n#PIGDEX081`;
  }

  async function share(specimen) {
    const data = { title: '维斯珀里昂猪种鉴定', text: shareText(specimen), url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(`${data.text}\n${data.url}`); toast('鉴定结果已复制到剪贴板。'); }
    } catch (error) { if (error?.name !== 'AbortError') toast('分享没有成功，请稍后再试。'); }
  }

  async function download(specimen) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#10263d'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#cfb98f'; ctx.lineWidth = 2; ctx.strokeRect(42, 42, 996, 1266); ctx.strokeRect(58, 58, 964, 1234);
    const image = new Image(); image.src = artworkOf(specimen);
    try { await image.decode(); ctx.drawImage(image, 96, 164, 440, 660); } catch { /* text certificate remains valid */ }
    ctx.fillStyle = '#cfb98f'; ctx.font = '26px serif'; ctx.fillText('VESPERION SPECIES IDENTIFICATION OFFICE', 96, 112);
    ctx.fillStyle = '#f3efe5'; ctx.font = '54px serif'; ctx.fillText('猪种鉴定身份牌', 586, 240);
    ctx.fillStyle = '#cfb98f'; ctx.font = '24px serif'; ctx.fillText(`ARCHIVE ${specimen.id} · ${specimen.rarity}`, 586, 300);
    ctx.fillStyle = '#f3efe5'; ctx.font = 'bold 46px serif';
    const chars = [...specimen.name];
    let line = '', y = 380;
    chars.forEach(char => { if (ctx.measureText(line + char).width > 390) { ctx.fillText(line, 586, y); line = char; y += 62; } else line += char; });
    ctx.fillText(line, 586, y);
    ctx.fillStyle = '#c2c8cb'; ctx.font = '24px serif'; ctx.fillText(specimen.latin, 586, y + 46);
    ctx.strokeStyle = 'rgba(207,185,143,.45)'; ctx.beginPath(); ctx.moveTo(586, y + 84); ctx.lineTo(984, y + 84); ctx.stroke();
    ctx.fillStyle = '#f3efe5'; ctx.font = '25px serif';
    const words = [...specimen.description]; line = ''; y += 132;
    words.forEach(char => { if (ctx.measureText(line + char).width > 390) { ctx.fillText(line, 586, y); line = char; y += 42; } else line += char; });
    ctx.fillText(line, 586, y);
    ctx.fillStyle = '#cfb98f'; ctx.font = '22px serif'; ctx.fillText('OFFICIAL FINDING · 本次正式鉴定', 96, 900);
    ctx.fillStyle = '#f3efe5'; ctx.font = 'bold 48px serif'; ctx.fillText('此猪身份成立，萌度合法。', 96, 970);
    ctx.fillStyle = '#c2c8cb'; ctx.font = '24px serif';
    ctx.fillText(`主要栖息地  ${specimen.habitat}`, 96, 1040);
    ctx.fillText(`当前状态    ${specimen.status}`, 96, 1090);
    ctx.fillText(`签发日期    ${new Intl.DateTimeFormat('zh-CN', { dateStyle: 'long' }).format(new Date())}`, 96, 1140);
    ctx.fillStyle = '#cfb98f'; ctx.font = 'bold 72px serif'; ctx.textAlign = 'right'; ctx.fillText('081', 984, 1240);
    ctx.textAlign = 'left';
    const link = document.createElement('a'); link.download = `PIGDEX-081-${specimen.id}.png`; link.href = canvas.toDataURL('image/png'); link.click();
    toast('身份牌已经签发。');
  }

  function showResult(specimen) {
    quiz.hidden = true; result.hidden = false;
    result.innerHTML = `<div class="identity-certificate">
      <div class="certificate-art"><img src="${artworkOf(specimen)}" alt="${escape(specimen.name)}" width="640" height="960"></div>
      <div class="certificate-copy"><p class="eyebrow">OFFICIAL IDENTIFICATION · ${escape(specimen.id)}</p><small>本次鉴定结果</small><h3>${escape(specimen.name)}</h3><em>${escape(specimen.latin)}</em><p>${escape(specimen.description)}</p>
      <dl><div><dt>稀有度</dt><dd>${escape(specimen.rarity)}</dd></div><div><dt>当前状态</dt><dd>${escape(specimen.status)}</dd></div><div><dt>主要栖息地</dt><dd>${escape(specimen.habitat)}</dd></div></dl>
      <p class="certificate-verdict">经鉴定：此猪身份成立，萌度合法；准予继续在维斯珀里昂宅邸自由活动。</p>
      <div class="certificate-actions"><button class="primary" data-action="download" type="button">保存身份牌</button><button class="secondary" data-action="share" type="button">分享结果</button><button class="secondary" data-action="restart" type="button">重新鉴定</button></div></div>
    </div>`;
    result.querySelector('[data-action="download"]').addEventListener('click', () => download(specimen));
    result.querySelector('[data-action="share"]').addEventListener('click', () => share(specimen));
    result.querySelector('[data-action="restart"]').addEventListener('click', start);
    renderHistory(saveHistory(specimen));
  }

  function start() {
    step = 0; answers = []; intro.hidden = true; result.hidden = true; quiz.hidden = false; showQuestion();
  }

  options.addEventListener('click', event => {
    const button = event.target.closest('[data-option]');
    if (!button) return;
    answers[step] = QUESTIONS[step].options[Number(button.dataset.option)][1];
    if (step < QUESTIONS.length - 1) { step += 1; showQuestion(); }
    else showResult(pickSpecimen(answers, byId));
  });
  document.querySelector('#identityBack').addEventListener('click', () => { if (step > 0) { step -= 1; answers = answers.slice(0, step); showQuestion(); } });
  document.querySelector('#startIdentity').addEventListener('click', start);
  renderHistory();
}
