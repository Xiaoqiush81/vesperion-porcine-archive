const DATA_URL = './data/chronicles.json?v=20261025-4';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderSections(sections, entries) {
  const host = document.querySelector('#chroniclePortals');
  host.replaceChildren(...sections.map(section => {
    const button = element('button', 'chronicle-portal');
    button.type = 'button';
    button.dataset.shelf = section.title;
    button.setAttribute('aria-controls', 'chronicleTimeline');
    button.setAttribute('aria-pressed', 'false');
    const count = entries.filter(entry => entry.shelf === section.title).length;
    button.append(
      element('span', '', section.kicker),
      element('h3', '', section.title),
      element('p', '', section.description),
      element('small', '', `${count} 卷已开放 · 点击调阅`)
    );
    return button;
  }));
  host.removeAttribute('aria-busy');
}

function renderVolumes(volumes, activeVolume) {
  const host = document.querySelector('#chronicleVolumes');
  host.hidden = !volumes.length;
  host.replaceChildren(...volumes.map(volume => {
    const button = element('button', 'chronicle-volume');
    button.type = 'button';
    button.dataset.volume = volume.title;
    button.setAttribute('aria-pressed', String(volume.title === activeVolume));
    button.append(element('span', '', volume.mark), element('b', '', volume.title));
    return button;
  }));
}

function renderEntries(entries, section, volume = '') {
  const host = document.querySelector('#chronicleTimeline');
  document.querySelector('#publicChronicleKicker').textContent = `OPEN SHELVES · ${section.kicker}${volume ? ` · ${volume}` : ''}`;
  document.querySelector('#publicChronicleTitle').textContent = volume ? `${section.title} · ${volume}` : section.title;
  document.querySelector('#publicChronicleDescription').textContent = section.description;
  document.querySelectorAll('.chronicle-portal').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.shelf === section.title));
  });
  const selected = entries.filter(entry => entry.shelf === section.title && (!volume || entry.volume === volume));
  host.replaceChildren(...selected.map(entry => {
    const article = element('article', 'chronicle-entry');
    const details = element('details', 'chronicle-entry-details');
    const summary = element('summary');
    summary.append(
      element('b', '', entry.title),
      element('p', 'chronicle-excerpt', entry.body),
      element('span', 'chronicle-expand', '展开完整卷宗')
    );
    const full = element('div', 'chronicle-entry-body');
    full.append(...(entry.details || [entry.body]).map(paragraph => element('p', '', paragraph)));
    details.append(summary, full);
    article.append(element('time', '', entry.period), details);
    return article;
  }));
  host.removeAttribute('aria-busy');
}

function renderInnerShelves(shelves) {
  const host = document.querySelector('#innerShelves');
  host.replaceChildren(...shelves.map(shelf => {
    const article = element('article');
    const list = element('div', 'inner-shelf-items');
    list.append(...(shelf.items || []).map(item => {
      const entry = element('section');
      entry.append(element('b', '', item.title), element('p', '', item.body));
      return entry;
    }));
    article.append(
      element('span', '', shelf.mark),
      element('b', '', shelf.title),
      element('small', '', shelf.status),
      list
    );
    return article;
  }));
}

function bindGate() {
  const room = document.querySelector('#chronicles');
  const seal = document.querySelector('#chronicleSeal');
  const gate = document.querySelector('#chronicleGate');
  const form = document.querySelector('#chronicleGateForm');
  const input = document.querySelector('#chroniclePassphrase');
  const status = document.querySelector('#chronicleGateStatus');
  const inner = document.querySelector('#innerChronicle');
  const publicChronicle = document.querySelector('.public-chronicle');
  const masthead = document.querySelector('#chronicleMasthead');
  const portals = document.querySelector('#chroniclePortals');
  let taps = [];

  const revealInner = () => {
    room.dataset.chronicleView = 'inner';
    masthead.hidden = true;
    portals.hidden = true;
    publicChronicle.hidden = true;
    inner.hidden = false;
    gate.close();
    input.value = '';
    status.textContent = '';
    inner.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  const restoreOuter = () => {
    room.dataset.chronicleView = 'index';
    gate.close();
    inner.hidden = true;
    publicChronicle.hidden = true;
    masthead.hidden = false;
    portals.hidden = false;
    input.value = '';
    status.textContent = '';
    taps = [];
  };

  seal.addEventListener('click', () => {
    const now = Date.now();
    taps = [...taps.filter(time => now - time < 4000), now];
    if (taps.length < 5) return;
    taps = [];
    gate.showModal();
    requestAnimationFrame(() => input.focus());
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const answer = input.value.trim().replace(/[\s—–_-]/g, '');
    if (/^咪+[～~。！!]*$/.test(answer)) revealInner();
    else {
      status.textContent = '馆印没有响应。或许应当听一听标准呼叫。';
      input.select();
    }
  });

  gate.querySelector('.gate-close').addEventListener('click', () => gate.close());
  document.querySelector('#leaveInnerChronicle').addEventListener('click', () => {
    restoreOuter();
    document.querySelector('#chronicles').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  document.addEventListener('roomchange', event => {
    if (event.detail.room !== 'chronicles') restoreOuter();
  });
}

let ready = false;
let gateBound = false;

export async function initChronicles() {
  if (ready) return;
  if (!gateBound) {
    bindGate();
    gateBound = true;
  }
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Chronicle data request failed: ${response.status}`);
    const data = await response.json();
    renderSections(data.sections, data.publicEntries);
    const masthead = document.querySelector('#chronicleMasthead');
    const room = document.querySelector('#chronicles');
    const portals = document.querySelector('#chroniclePortals');
    const publicChronicle = document.querySelector('.public-chronicle');
    const innerChronicle = document.querySelector('#innerChronicle');
    const scrollToTop = () => document.querySelector('#chronicles').scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
    const showIndex = () => {
      room.dataset.chronicleView = 'index';
      publicChronicle.hidden = true;
      innerChronicle.hidden = true;
      masthead.hidden = false;
      portals.hidden = false;
      document.querySelectorAll('.chronicle-portal').forEach(button => button.setAttribute('aria-pressed', 'false'));
      scrollToTop();
    };
    const selectSection = (title, requestedVolume = '') => {
      room.dataset.chronicleView = 'public';
      const section = data.sections.find(item => item.title === title) || data.sections[0];
      const volumes = section.volumes || [];
      const volume = volumes.some(item => item.title === requestedVolume) ? requestedVolume : (volumes[0]?.title || '');
      renderVolumes(volumes, volume);
      renderEntries(data.publicEntries, section, volume);
      masthead.hidden = true;
      portals.hidden = true;
      innerChronicle.hidden = true;
      publicChronicle.hidden = false;
    };
    document.querySelector('#chroniclePortals').addEventListener('click', event => {
      const portal = event.target.closest('.chronicle-portal');
      if (!portal) return;
      selectSection(portal.dataset.shelf);
      scrollToTop();
    });
    document.querySelector('#chronicleVolumes').addEventListener('click', event => {
      const volume = event.target.closest('.chronicle-volume');
      if (!volume) return;
      selectSection('猪史', volume.dataset.volume);
    });
    document.querySelector('#chronicleSectionBack').addEventListener('click', showIndex);
    showIndex();
    renderInnerShelves(data.innerShelves);
    ready = true;
  } catch (error) {
    console.error(error);
    document.querySelector('#chronicleLoading').textContent = '卷宗暂时无法调阅，请稍后重试。';
    throw error;
  }
}
