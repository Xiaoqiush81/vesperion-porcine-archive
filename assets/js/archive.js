const RARITY_RANK = Object.freeze({ '宇宙唯一': 6, '神话': 5, '史诗': 4, '限定': 3, '稀有': 2, '普通': 1 });

const card = specimen => `
  <button class="card" data-id="${specimen.id}">
    <span class="card-top"><span>${specimen.number}</span><span class="rarity">${specimen.rarity}</span></span>
    <span class="card-art"><span class="mini-pig" style="--pig-color:${specimen.color}">${specimen.number.replace('081-', '')}</span></span>
    <h3>${specimen.name}</h3><span class="latin">${specimen.latin}</span>
    <p class="desc">${specimen.description}</p>
    <span class="tag-row">${specimen.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</span>
  </button>`;

export async function loadSpecimens() {
  const response = await fetch('data/specimens.json?v=20261012-44', { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Archive request failed: ${response.status}`);
  return response.json();
}

export function createArchive(specimens) {
  const state = { category: '全部', query: '' };
  const get = selector => document.querySelector(selector);
  const grid = get('#specimenGrid');
  const dialog = get('#specimenDialog');
  const content = get('#dialogContent');

  function open(id) {
    const item = specimens.find(specimen => specimen.id === id);
    if (!item) return;
    content.innerHTML = `<section class="detail-hero"><span class="detail-number">ARCHIVE ${item.id} · ${item.rarity}</span><h2>${item.name}</h2><span class="latin">${item.latin}</span></section><section class="detail-body"><p>${item.description}</p><div class="facts"><div class="fact"><small>首次观测</small><b>${item.firstObserved}</b></div><div class="fact"><small>主要栖息地</small><b>${item.habitat}</b></div><div class="fact"><small>当前状态</small><b>${item.status}</b></div><div class="fact"><small>档案分类</small><b>${item.category}</b></div></div><div class="abilities"><h3>KNOWN ABILITIES · 已知能力</h3><ul>${item.abilities.map(ability => `<li>${ability}</li>`).join('')}</ul></div><div class="tag-row">${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div></section>`;
    dialog.showModal();
  }

  function render() {
    const query = state.query.toLowerCase().trim();
    const visible = specimens
      .filter(item => (state.category === '全部' || item.category === state.category)
        && (!query || [item.name, item.latin, item.description, item.habitat, item.status, ...item.tags, ...item.abilities].join(' ').toLowerCase().includes(query)))
      .sort((a, b) => (RARITY_RANK[b.rarity] || 0) - (RARITY_RANK[a.rarity] || 0));
    grid.innerHTML = visible.map(card).join('');
    get('#resultCount').textContent = `DISPLAYING ${visible.length} / ${specimens.length} RECORDS`;
    get('#emptyState').hidden = visible.length !== 0;
  }

  const categories = ['全部', ...new Set(specimens.map(item => item.category))];
  get('#filters').innerHTML = categories.map((category, index) => `<button class="filter ${index ? '' : 'active'}" data-category="${category}">${category}</button>`).join('');

  get('#filters').addEventListener('click', event => {
    if (!event.target.matches('.filter')) return;
    state.category = event.target.dataset.category;
    document.querySelectorAll('.filter').forEach(button => button.classList.toggle('active', button === event.target));
    render();
  });
  get('#searchInput').addEventListener('input', event => { state.query = event.target.value; render(); });
  get('#resetFilters').addEventListener('click', () => {
    state.category = '全部'; state.query = ''; get('#searchInput').value = '';
    document.querySelectorAll('.filter').forEach((button, index) => button.classList.toggle('active', index === 0));
    render();
  });
  grid.addEventListener('click', event => open(event.target.closest('.card')?.dataset.id));
  get('#randomPig').addEventListener('click', () => open(specimens[Math.floor(Math.random() * specimens.length)].id));
  get('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

  get('#countAll').textContent = specimens.length;
  get('#countMythic').textContent = specimens.filter(item => item.rarity === '神话').length;
  render();
}
