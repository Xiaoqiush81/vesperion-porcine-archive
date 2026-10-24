const DATA_URL = './data/chronicles.json?v=20261025-2';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderSections(sections) {
  const host = document.querySelector('#chroniclePortals');
  host.replaceChildren(...sections.map(section => {
    const article = element('article');
    article.append(
      element('span', '', section.kicker),
      element('h3', '', section.title),
      element('p', '', section.description),
      element('small', '', section.status)
    );
    return article;
  }));
  host.removeAttribute('aria-busy');
}

function renderEntries(entries) {
  const host = document.querySelector('#chronicleTimeline');
  host.replaceChildren(...entries.map(entry => {
    const article = element('article');
    const copy = element('div');
    copy.append(element('b', '', entry.title), element('p', '', entry.body));
    const label = entry.shelf ? `${entry.shelf} · ${entry.period}` : entry.period;
    article.append(element('time', '', label), copy);
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
  const seal = document.querySelector('#chronicleSeal');
  const gate = document.querySelector('#chronicleGate');
  const form = document.querySelector('#chronicleGateForm');
  const input = document.querySelector('#chroniclePassphrase');
  const status = document.querySelector('#chronicleGateStatus');
  const inner = document.querySelector('#innerChronicle');
  const publicChronicle = document.querySelector('.public-chronicle');
  let taps = [];

  const revealInner = () => {
    publicChronicle.hidden = true;
    inner.hidden = false;
    gate.close();
    input.value = '';
    status.textContent = '';
    inner.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
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
    inner.hidden = true;
    publicChronicle.hidden = false;
    publicChronicle.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
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
    renderSections(data.sections);
    renderEntries(data.publicEntries);
    renderInnerShelves(data.innerShelves);
    ready = true;
  } catch (error) {
    console.error(error);
    document.querySelector('#chronicleLoading').textContent = '卷宗暂时无法调阅，请稍后重试。';
    throw error;
  }
}
