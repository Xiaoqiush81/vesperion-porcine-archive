import { initScholia } from './scholia.js?v=20261101-scholia-5';

const DATA_URL = './data/chronicles.json?v=20261101-poetry-scholia-4';
let scholiaController;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderEntryBody(host, entry) {
  if (entry.verse?.length) {
    const verse = element('blockquote', 'chronicle-verse');
    verse.append(...entry.verse.map(line => element('span', '', line)));
    host.append(verse);
  }
  const paragraphs = entry.details || (entry.verse ? [] : [entry.body]);
  host.append(...paragraphs.map(paragraph => element('p', '', paragraph)));
}

function renderEntry(entry, fallbackPeriod = '') {
  const article = element('article', 'chronicle-entry');
  const details = element('details', 'chronicle-entry-details');
  const summary = element('summary');
  summary.append(
    element('b', '', entry.title),
    element('p', 'chronicle-excerpt', entry.excerpt || entry.body),
    element('span', 'chronicle-expand', '展开完整卷宗')
  );
  const full = element('div', 'chronicle-entry-body');
  renderEntryBody(full, entry);
  details.append(summary, full);
  article.append(element('time', '', entry.period || fallbackPeriod), details);
  return article;
}

function renderVolumeButtons(host, volumes, activeVolume, extraClass = '') {
  host.hidden = !volumes.length;
  host.replaceChildren(...volumes.map(volume => {
    const button = element('button', `chronicle-volume${extraClass ? ` ${extraClass}` : ''}`);
    button.type = 'button';
    button.dataset.volume = volume.title;
    button.setAttribute('aria-pressed', String(volume.title === activeVolume));
    button.append(element('span', '', volume.mark), element('b', '', volume.title));
    return button;
  }));
}

function enterAfterTap(button, action) {
  if (!matchMedia('(pointer: coarse)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    action();
    return;
  }
  if (button.dataset.transitioning === 'true') return;
  button.dataset.transitioning = 'true';
  button.classList.add('is-tapped');
  setTimeout(() => {
    button.classList.remove('is-tapped');
    delete button.dataset.transitioning;
    action();
  }, 130);
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
    const catalogue = section.volumes?.length
      ? `${section.volumes.length} 卷 · ${count} 条已归档`
      : `${count} 条记录 · 点击调阅`;
    button.append(
      element('span', '', section.kicker),
      element('h3', '', section.title),
      element('p', '', section.description),
      element('small', '', catalogue)
    );
    return button;
  }));
  host.removeAttribute('aria-busy');
}

function renderVolumes(volumes, activeVolume) {
  renderVolumeButtons(document.querySelector('#chronicleVolumes'), volumes, activeVolume);
}

function renderEntries(entries, section, volume = '') {
  const host = document.querySelector('#chronicleTimeline');
  document.querySelector('#publicChronicleKicker').textContent = `OPEN SHELVES · ${section.kicker}${volume ? ` · ${volume}` : ''}`;
  document.querySelector('#publicChronicleTitle').textContent = volume ? `${section.title} · ${volume}` : section.title;
  document.querySelector('#publicChronicleDescription').textContent = section.description;
  document.querySelectorAll('#chroniclePortals .chronicle-portal').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.shelf === section.title));
  });
  const selected = entries.filter(entry => entry.shelf === section.title && (!volume || entry.volume === volume));
  host.replaceChildren(...selected.map(entry => renderEntry(entry)));
  host.removeAttribute('aria-busy');
}

function renderInnerShelves(shelves) {
  const host = document.querySelector('#innerShelves');
  const index = document.querySelector('#innerIndex');
  const masthead = index.querySelector('.chronicle-masthead');
  const collection = document.querySelector('#innerCollection');
  const volumeNav = document.querySelector('#innerVolumeNav');
  const timeline = document.querySelector('#innerTimeline');

  const renderEntries = (items, period) => {
    timeline.replaceChildren(...items.map(item => renderEntry(item, period)));
  };

  const selectShelf = (shelf, requestedVolume = '', revealCollection = false) => {
    const volumes = shelf.volumes || [];
    const volume = volumes.find(item => item.title === requestedVolume) || volumes[0];
    document.querySelector('#innerCollectionKicker').textContent = `PRIVATE SHELVES · ${shelf.status}${volume ? ` · ${volume.title}` : ''}`;
    document.querySelector('#innerCollectionTitle').textContent = volume ? `${shelf.title} · ${volume.title}` : shelf.title;
    document.querySelector('#innerCollectionDescription').textContent = volume
      ? `${volume.items.length} 条私藏记录，已归入本卷。`
      : `${(shelf.items || []).length} 条私藏记录，供馆员内部调阅。`;
    volumeNav.hidden = !volumes.length;
    if (volumeNav.dataset.shelf !== shelf.title) {
      renderVolumeButtons(volumeNav, volumes, volume?.title, 'inner-volume-button');
    }
    volumeNav.querySelectorAll('.inner-volume-button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.volume === volume?.title));
    });
    renderEntries(volume ? volume.items : (shelf.items || []), volume?.mark || shelf.mark);
    scholiaController?.showEntry('inner', volume?.title === '猪诗');
    volumeNav.dataset.shelf = shelf.title;
    index.hidden = true;
    collection.hidden = false;
    if (revealCollection) requestAnimationFrame(() => collection.scrollIntoView({
      block: 'start',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    }));
  };

  host.replaceChildren(...shelves.map(shelf => {
    const button = element('button', 'chronicle-portal inner-shelf');
    button.type = 'button';
    button.dataset.shelf = shelf.title;
    const count = shelf.volumes?.reduce((total, volume) => total + volume.items.length, 0) || shelf.items?.length || 0;
    button.append(
      element('span', '', shelf.mark),
      element('h3', '', shelf.title),
      element('p', '', shelf.status),
      element('small', '', shelf.volumes?.length ? `${shelf.volumes.length} 卷 · ${count} 条` : `${count} 条私藏记录`)
    );
    return button;
  }));

  host.addEventListener('click', event => {
    const button = event.target.closest('.inner-shelf');
    if (!button) return;
    enterAfterTap(button, () => selectShelf(shelves.find(shelf => shelf.title === button.dataset.shelf) || shelves[0], '', true));
  });
  volumeNav.addEventListener('click', event => {
    const button = event.target.closest('.inner-volume-button');
    if (!button) return;
    const shelf = shelves.find(item => item.title === volumeNav.dataset.shelf);
    if (!shelf) return;
    const scrollTop = window.scrollY;
    selectShelf(shelf, button.dataset.volume);
    requestAnimationFrame(() => {
      document.documentElement.scrollTop = scrollTop;
      document.body.scrollTop = scrollTop;
    });
  });
  document.querySelector('#innerSectionBack').addEventListener('click', () => {
    collection.hidden = true;
    index.hidden = false;
    requestAnimationFrame(() => masthead.scrollIntoView({
      block: 'start',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    }));
  });
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
    document.querySelector('#innerIndex').hidden = false;
    document.querySelector('#innerCollection').hidden = true;
    gate.close();
    input.value = '';
    status.textContent = '';
    room.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  const restoreOuter = () => {
    room.dataset.chronicleView = 'index';
    gate.close();
    inner.hidden = true;
    document.querySelector('#innerIndex').hidden = false;
    document.querySelector('#innerCollection').hidden = true;
    publicChronicle.hidden = true;
    masthead.hidden = false;
    portals.hidden = false;
    input.value = '';
    status.textContent = '';
    taps = [];
    scholiaController?.hideEntries();
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
    if (!['chronicles', 'scholia'].includes(event.detail.room)) restoreOuter();
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
      scholiaController?.hideEntries();
      document.querySelectorAll('#chroniclePortals .chronicle-portal').forEach(button => button.setAttribute('aria-pressed', 'false'));
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
      scholiaController?.showEntry('outer', section.title === '猪史' && volume === '猪诗');
    };
    scholiaController = await initScholia();
    document.querySelector('#chroniclePortals').addEventListener('click', event => {
      const portal = event.target.closest('.chronicle-portal');
      if (!portal) return;
      enterAfterTap(portal, () => {
        selectSection(portal.dataset.shelf);
        scrollToTop();
      });
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
