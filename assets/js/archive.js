import { escapeHtml as escape, specimenArt, specimenArtwork } from './specimen-art.js?v=20261023-details-1';
import { isFavorite, toggleFavorite } from './favorites.js?v=20261021-1';
import { markdownInline, markdownToHtml } from './markdown.js?v=20261112-architecture-1';

const RARITY_RANK = Object.freeze({ '宇宙唯一': 6, '神话': 5, '史诗': 4, '限定': 3, '稀有': 2, '普通': 1 });

const card = (specimen, favorite) => `
  <button class="card" type="button" data-id="${escape(specimen.id)}" data-number="${escape(specimen.number)}" aria-label="查看${escape(specimen.name)}档案">
    <span class="card-favorite" aria-hidden="true">${favorite ? '♥' : ''}</span>
    <span class="card-top"><span>${escape(specimen.number)}</span><span class="rarity">${escape(specimen.rarity)}</span></span>
    ${specimenArt(specimen)}
    <span class="card-name" data-label="${escape(specimen.name)}">${escape(specimen.name)}</span><span class="latin">${escape(specimen.latin)}</span>
    <span class="desc markdown-inline">${markdownInline(specimen.description)}</span>
    <span class="tag-row">${specimen.tags.map(tag => `<span class="tag">${escape(tag)}</span>`).join('')}</span>
  </button>`;

export async function loadSpecimens() {
  const response = await fetch('data/specimens.json?v=20261031-specimens-59', { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Archive request failed: ${response.status}`);
  return response.json();
}

export function createArchive(specimens) {
  const state = { category: '全部', query: '' };
  const get = selector => document.querySelector(selector);
  const grid = get('#specimenGrid');
  const dialog = get('#specimenDialog');
  const content = get('#dialogContent');
  const records = [...specimens].sort((a, b) => (RARITY_RANK[b.rarity] || 0) - (RARITY_RANK[a.rarity] || 0));
  const byId = new Map(specimens.map(item => [item.id, item]));
  const searchIndex = new Map(specimens.map(item => [item.id,
    [item.name, item.latin, item.description, item.habitat, item.status, ...item.tags, ...item.abilities].join(' ').toLowerCase()
  ]));
  let renderFrame = 0;
  let detailTimer = 0;

  function detail(item) {
    const favorite = isFavorite('specimens', item.id);
    return `<div class="detail-layout"><figure class="detail-art"><img src="${specimenArtwork(item)}" alt="${escape(item.name)}卡面" width="640" height="960" decoding="async"></figure><div class="detail-copy"><section class="detail-hero"><span class="detail-number"><span class="base-only">ARCHIVE</span><span class="signal-only">SIGNAL FILE</span> ${escape(item.id)} · ${escape(item.rarity)}</span><h2 data-label="${escape(item.name)}">${escape(item.name)}</h2><span class="latin">${escape(item.latin)}</span><div class="detail-actions"><button class="favorite-toggle" type="button" data-favorite-type="specimens" data-favorite-id="${escape(item.id)}" aria-pressed="${favorite}">${favorite ? '♥ 已收藏此形态' : '♡ 收藏此形态'}</button></div></section><section class="detail-body"><div class="markdown-content">${markdownToHtml(item.description)}</div><div class="facts"><div class="fact"><small>首次观测</small><b>${escape(item.firstObserved)}</b></div><div class="fact"><small>主要栖息地</small><b>${escape(item.habitat)}</b></div><div class="fact"><small>当前状态</small><b>${escape(item.status)}</b></div><div class="fact"><small>档案分类</small><b>${escape(item.category)}</b></div></div><div class="abilities"><h3>KNOWN ABILITIES · 已知能力</h3><ul>${item.abilities.map(ability => `<li class="markdown-inline">${markdownInline(ability)}</li>`).join('')}</ul></div><div class="tag-row">${item.tags.map(tag => `<span class="tag">${escape(tag)}</span>`).join('')}</div><nav class="detail-switch signal-only" aria-label="切换信号档案"><button type="button" data-detail-step="-1">← PREV SIGNAL</button><span>NODE ${escape(item.number)}</span><button type="button" data-detail-step="1">NEXT SIGNAL →</button></nav></section></div></div>`;
  }

  function open(id) {
    const item = byId.get(id);
    if (!item) return;
    const paint = () => { content.dataset.activeId = item.id; content.innerHTML = detail(item); };
    clearTimeout(detailTimer);
    if (dialog.open && document.documentElement.dataset.theme === 'signal') {
      content.classList.add('is-switching');
      detailTimer = setTimeout(() => {
        paint();
        content.classList.remove('is-switching');
        content.classList.add('is-resolving');
        detailTimer = setTimeout(() => content.classList.remove('is-resolving'), 280);
      }, 140);
      return;
    }
    paint();
    if (!dialog.open) dialog.showModal();
    if (document.documentElement.dataset.theme === 'signal') {
      content.classList.add('is-resolving');
      detailTimer = setTimeout(() => content.classList.remove('is-resolving'), 320);
    }
  }

  function render() {
    const query = state.query.toLowerCase().trim();
    const visible = records
      .filter(item => (state.category === '全部' || item.category === state.category)
        && (!query || searchIndex.get(item.id).includes(query)));
    grid.innerHTML = visible.map(item => card(item, isFavorite('specimens', item.id))).join('');
    get('#resultCount').textContent = `DISPLAYING ${visible.length} / ${specimens.length} RECORDS`;
    get('#emptyState').hidden = visible.length !== 0;
  }

  const categories = ['全部', ...new Set(specimens.map(item => item.category))];
  get('#filters').innerHTML = categories.map((category, index) => `<button class="filter ${index ? '' : 'active'}" data-category="${escape(category)}">${escape(category)}</button>`).join('');

  get('#filters').addEventListener('click', event => {
    if (!event.target.matches('.filter')) return;
    state.category = event.target.dataset.category;
    document.querySelectorAll('.filter').forEach(button => button.classList.toggle('active', button === event.target));
    render();
  });
  get('#searchInput').addEventListener('input', event => {
    state.query = event.target.value;
    cancelAnimationFrame(renderFrame);
    renderFrame = requestAnimationFrame(render);
  });
  get('#resetFilters').addEventListener('click', () => {
    state.category = '全部'; state.query = ''; get('#searchInput').value = '';
    document.querySelectorAll('.filter').forEach((button, index) => button.classList.toggle('active', index === 0));
    render();
  });
  grid.addEventListener('click', event => open(event.target.closest('.card')?.dataset.id));
  content.addEventListener('click', event => {
    const step = Number(event.target.closest('[data-detail-step]')?.dataset.detailStep);
    if (step) {
      const current = records.findIndex(item => item.id === content.dataset.activeId);
      open(records[(current + step + records.length) % records.length].id);
      return;
    }
    const button = event.target.closest('[data-favorite-type="specimens"]');
    if (!button) return;
    const active = toggleFavorite('specimens', button.dataset.favoriteId);
    button.setAttribute('aria-pressed', active);
    button.textContent = active ? '♥ 已收藏此形态' : '♡ 收藏此形态';
    render();
  });
  get('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

  get('#countAll').textContent = specimens.length;
  get('#countMythic').textContent = specimens.filter(item => item.rarity === '神话').length;
  render();

  return Object.freeze({
    openRandom() {
      open(specimens[Math.floor(Math.random() * specimens.length)].id);
    }
  });
}
