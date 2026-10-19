import { TAROT_CARDS, TAROT_GROUPS, TAROT_SPREADS, getReadingMeaning, getSpread } from './tarot-data.js?v=20261019-modular-1';
import { createReadingSession } from './tarot-engine.js?v=20261019-modular-1';
import { addReadingRecord, loadReadingHistory } from './tarot-storage.js?v=20261019-modular-1';

const CARD_BACK_URL = 'assets/tarot/card-back.webp?v=2651';
const CARD_ART_VERSION = 'modular-20261019';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
})[character]);

function artworkUrl(filename) {
  const [path, query = ''] = String(filename).split('?');
  return `assets/tarot/${path}?${query ? `${query}&` : ''}v=${CARD_ART_VERSION}`;
}

function queryElements(root) {
  const find = selector => root.querySelector(selector);
  const elements = {
    grid:find('#tarotGrid'), tabs:find('#tarotTabs'), progress:find('#tarotProgress'), revealButton:find('#revealTarot'),
    dialog:find('#tarotDialog'), dialogContent:find('#tarotDialogContent'), spreadPicker:find('#spreadPicker'),
    drawButton:find('#drawTarot'), resetButton:find('#resetTarot'), readingTable:find('#readingTable'),
    readingNotes:find('#readingNotes'), readingJournal:find('#readingJournal'), practiceStatus:find('#practiceStatus'),
    reversalToggle:find('#reversalToggle'), customCountWrap:find('#customCountWrap'), customCount:find('#customCount'),
    readingExtras:find('#readingExtras'), clarifierButton:find('#drawClarifier'), bottomButton:find('#showBottomCard'),
    saveButton:find('#saveReading'), saveStatus:find('#saveReadingStatus'), historyCount:find('#historyCount'),
    historyList:find('#historyList'), questionInput:find('#tarotQuestion')
  };
  const missing = Object.entries(elements).filter(([, element]) => !element).map(([name]) => name);
  if (missing.length) throw new Error(`Tarot cabinet is missing: ${missing.join(', ')}`);
  return elements;
}

function readingCardMarkup(item, position, index, extra = false) {
  const orientation = item.reversed ? '逆位' : '正位';
  return `<article class="draw-slot ${extra ? 'is-extra' : ''}" data-draw-index="${index}">
    <p class="draw-position">${escapeHtml(position)}</p>
    <button class="draw-card" type="button" aria-label="翻开${escapeHtml(position)}牌">
      <span class="draw-card-inner">
        <span class="draw-face draw-back" aria-hidden="true"><img src="${CARD_BACK_URL}" alt="" width="320" height="480" decoding="async"></span>
        <span class="draw-face draw-front"><img class="${item.reversed ? 'reversed-art' : ''}" src="${artworkUrl(item.card.artwork)}" alt="" width="320" height="480" decoding="async"></span>
      </span>
    </button>
    <span class="draw-hint">点击翻牌</span>
    <p class="draw-meaning"><b>${escapeHtml(item.card.name)} · ${escapeHtml(item.card.title)} <em>${orientation}</em></b>${escapeHtml(getReadingMeaning(item.card, item.reversed))}</p>
  </article>`;
}

function renderHistory(elements, history = loadReadingHistory()) {
  elements.historyCount.textContent = history.length;
  if (!history.length) {
    elements.historyList.innerHTML = '<p class="history-empty">还没有记录。第一场正式占卜会留在这里。</p>';
    return;
  }
  elements.historyList.innerHTML = history.map(entry => {
    let date = '时间未知';
    try { date = new Intl.DateTimeFormat('zh-CN', { dateStyle:'medium', timeStyle:'short' }).format(new Date(entry.createdAt)); }
    catch { /* Keep the fallback label for malformed legacy records. */ }
    const cards = entry.cards.map(item => `${item.name}${item.reversed ? '（逆）' : ''}`).join(' · ');
    return `<article><time>${escapeHtml(date)}</time><b>${escapeHtml(entry.question || '未命名的问题')}</b><p>${escapeHtml(cards)}</p>${entry.note ? `<small>${escapeHtml(entry.note)}</small>` : ''}</article>`;
  }).join('');
}

export function createTarotCabinet(root = document) {
  const cabinet = root.querySelector('#tarot');
  if (!cabinet || cabinet.dataset.tarotReady === 'true') return;
  cabinet.dataset.tarotReady = 'true';

  const elements = queryElements(root);
  const revealed = new Set();
  let activeGroup = TAROT_GROUPS[0].id;
  let activeSpreadId = TAROT_SPREADS[0].id;
  let drawing = false;
  let session = null;

  elements.tabs.innerHTML = TAROT_GROUPS.map((group, index) => `<button class="tarot-tab ${index ? '' : 'active'}" data-group="${group.id}" type="button">${escapeHtml(group.label)}</button>`).join('');
  elements.spreadPicker.innerHTML = TAROT_SPREADS.map((spread, index) => `<button class="spread-choice ${index ? '' : 'active'}" data-spread="${spread.id}" type="button"><b>${escapeHtml(spread.label)}</b><small>${escapeHtml(spread.description)}</small></button>`).join('');

  function renderCollection() {
    const visible = TAROT_CARDS.filter(card => card.group === activeGroup);
    elements.grid.innerHTML = visible.map(card => `<button class="tarot-card ${card.artwork ? 'is-collected' : 'is-pending'} ${revealed.has(card.id) ? 'is-revealed' : ''}" data-id="${escapeHtml(card.id)}" type="button" aria-label="${revealed.has(card.id) ? `查看${escapeHtml(card.name)}详情` : `翻开${escapeHtml(card.name)}`}" ${card.artwork ? '' : 'disabled'}>
      <span class="tarot-art"><span class="tarot-card-inner"><span class="tarot-face tarot-back"><img src="${CARD_BACK_URL}" alt="" width="320" height="480" loading="lazy" decoding="async"></span><span class="tarot-face tarot-front">${card.artwork ? `<img src="${artworkUrl(card.artwork)}" alt="${escapeHtml(card.name)}牌面" width="320" height="480" loading="lazy" decoding="async">` : `<span class="tarot-placeholder"><b>${escapeHtml(card.number)}</b><i>VESPERION</i><span>馆藏空位</span></span>`}</span></span></span>
      <span class="tarot-meta"><small>${card.group === 'major' ? 'MAJOR ARCANA' : card.group.toUpperCase()}</small><b>${escapeHtml(card.name)}</b><em>${escapeHtml(card.title)}</em></span>
    </button>`).join('');
    elements.progress.textContent = `COLLECTED ${visible.filter(card => card.artwork).length} / ${visible.length}`;
  }

  function openCard(id) {
    const card = TAROT_CARDS.find(item => item.id === id);
    if (!card?.artwork) return;
    elements.dialogContent.innerHTML = `<div class="tarot-detail"><figure class="tarot-detail-art"><img src="${artworkUrl(card.artwork)}" alt="${escapeHtml(card.name)}牌面" width="768" height="1152" decoding="async"></figure><div><p class="eyebrow">${escapeHtml(card.number)} · ${card.group === 'major' ? 'MAJOR ARCANA' : card.group.toUpperCase()}</p><h2>${escapeHtml(card.name)}</h2><p class="tarot-english">${escapeHtml(card.title)}</p><p>${escapeHtml(card.meaning)}</p></div></div>`;
    elements.dialog.showModal();
  }

  function clearReading(message = '牌组安静地等待着。') {
    elements.readingTable.className = 'reading-table';
    elements.readingTable.replaceChildren();
    elements.readingNotes.hidden = true;
    elements.readingJournal.value = '';
    elements.readingExtras.hidden = true;
    elements.clarifierButton.disabled = false;
    elements.bottomButton.disabled = false;
    elements.saveButton.disabled = false;
    elements.saveStatus.textContent = '';
    elements.resetButton.disabled = true;
    elements.practiceStatus.textContent = message;
    session = null;
    drawing = false;
  }

  function currentPositions() {
    if (activeSpreadId !== 'custom') return getSpread(activeSpreadId).positions;
    const count = Math.min(12, Math.max(1, Number(elements.customCount.value) || 1));
    elements.customCount.value = count;
    return Array.from({ length:count }, (_, index) => `第 ${index + 1} 张`);
  }

  function deal() {
    if (drawing) return;
    drawing = true;
    elements.drawButton.disabled = true;
    elements.saveButton.disabled = false;
    elements.saveStatus.textContent = '';
    elements.readingNotes.hidden = true;
    elements.readingExtras.hidden = true;
    elements.readingTable.className = 'reading-table has-cards';
    elements.readingTable.replaceChildren();
    elements.practiceStatus.textContent = '正在洗牌……请把注意力留在问题上。';

    try {
      session = createReadingSession({
        pool:TAROT_CARDS,
        positions:currentPositions(),
        spreadId:activeSpreadId,
        question:elements.questionInput.value,
        reversals:elements.reversalToggle.checked
      });
    } catch (error) {
      console.error(error);
      clearReading('牌组暂时没有回应，请重新洗牌。');
      elements.drawButton.disabled = false;
      return;
    }

    window.setTimeout(() => {
      elements.readingTable.dataset.size = String(session.cards.length);
      elements.readingTable.innerHTML = session.cards.map((item, index) => readingCardMarkup(item, session.positions[index], index)).join('');
      elements.practiceStatus.textContent = `已抽取 ${session.cards.length} 张。按自己的节奏逐张翻开。`;
      elements.resetButton.disabled = false;
      elements.drawButton.disabled = false;
      drawing = false;
    }, 620);
  }

  elements.tabs.addEventListener('click', event => {
    const button = event.target.closest('.tarot-tab');
    if (!button) return;
    activeGroup = button.dataset.group;
    elements.tabs.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
    renderCollection();
  });

  elements.grid.addEventListener('click', event => {
    const button = event.target.closest('.tarot-card');
    const id = button?.dataset.id;
    if (!id || button.disabled) return;
    if (!revealed.has(id)) {
      revealed.add(id);
      button.classList.add('is-revealed');
      button.setAttribute('aria-label', `查看${TAROT_CARDS.find(card => card.id === id)?.name || ''}详情`);
      return;
    }
    openCard(id);
  });

  elements.revealButton.addEventListener('click', () => {
    const visible = TAROT_CARDS.filter(card => card.group === activeGroup && card.artwork);
    const allOpen = visible.every(card => revealed.has(card.id));
    visible.forEach(card => allOpen ? revealed.delete(card.id) : revealed.add(card.id));
    elements.revealButton.textContent = allOpen ? '全部翻开' : '全部盖回';
    renderCollection();
  });

  elements.dialog.querySelector('.tarot-close').addEventListener('click', () => elements.dialog.close());
  elements.dialog.addEventListener('click', event => { if (event.target === elements.dialog) elements.dialog.close(); });
  elements.dialog.addEventListener('close', () => elements.dialogContent.replaceChildren());

  elements.spreadPicker.addEventListener('click', event => {
    const button = event.target.closest('.spread-choice');
    if (!button || drawing) return;
    activeSpreadId = button.dataset.spread;
    elements.spreadPicker.querySelectorAll('.spread-choice').forEach(item => item.classList.toggle('active', item === button));
    elements.customCountWrap.hidden = activeSpreadId !== 'custom';
    clearReading(`已选择「${button.querySelector('b').textContent}」。`);
  });

  elements.drawButton.addEventListener('click', deal);
  elements.resetButton.addEventListener('click', () => clearReading('本次牌阵已收起，可以带着新问题再次洗牌。'));

  elements.readingTable.addEventListener('click', event => {
    const button = event.target.closest('.draw-card');
    if (!button || button.classList.contains('revealed')) return;
    button.classList.add('revealed');
    button.closest('.draw-slot').classList.add('is-revealed');
    button.nextElementSibling.textContent = '已翻开';
    const left = elements.readingTable.querySelectorAll('.draw-card:not(.revealed)').length;
    elements.practiceStatus.textContent = left ? `还有 ${left} 张牌没有翻开。` : '牌阵已经完整显现。现在试着把它们串成一句话。';
    if (!left) {
      elements.readingNotes.hidden = false;
      elements.readingExtras.hidden = false;
    }
  });

  elements.clarifierButton.addEventListener('click', () => {
    const item = session?.drawClarifier();
    if (!item) return;
    elements.readingTable.insertAdjacentHTML('beforeend', readingCardMarkup(item, item.position, session.positions.length + session.extras.length - 1, true));
    elements.clarifierButton.disabled = true;
    elements.readingNotes.hidden = true;
    elements.practiceStatus.textContent = '补牌已经落下；翻开它，看看它解释了哪一处疑惑。';
  });

  elements.bottomButton.addEventListener('click', () => {
    const item = session?.drawBottom();
    if (!item) return;
    elements.readingTable.insertAdjacentHTML('beforeend', readingCardMarkup(item, item.position, session.positions.length + session.extras.length - 1, true));
    elements.bottomButton.disabled = true;
    elements.readingNotes.hidden = true;
    elements.practiceStatus.textContent = '底牌代表没有明说、却一直影响问题的潜在能量。';
  });

  elements.saveButton.addEventListener('click', () => {
    if (!session) return;
    const result = addReadingRecord(session.toRecord(elements.readingJournal.value));
    elements.saveStatus.textContent = result.ok ? '已经收进记录册。' : '记录没有存下；浏览器可能禁止了本地存储。';
    if (result.ok) elements.saveButton.disabled = true;
    renderHistory(elements, result.history);
  });

  elements.reversalToggle.addEventListener('change', () => {
    elements.practiceStatus.textContent = elements.reversalToggle.checked ? '逆位已经启用；牌会随机选择正位或逆位。' : '逆位已经关闭；本次只使用正位。';
  });

  renderHistory(elements);
  renderCollection();
}
