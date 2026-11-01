const DATA_URL = './data/scholia.json?v=20261101-scholia-8';
const STORAGE_KEY = 'vesperion-scholia-answers-v1';

function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function loadAnswers() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

function saveAnswers(answers) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(answers)); }
  catch { /* Writing answers still works when storage is unavailable. */ }
}

function renderQuestion(question, material, subject, answers) {
  const article = element('article', 'scholia-question');
  const heading = element('header', 'scholia-question-heading');
  heading.append(
    element('span', 'scholia-subject-mark', subject.mark),
    element('small', '', `${subject.label} · ${material.title}`),
    element('h3', '', question.title)
  );
  const prompt = element('p', 'scholia-prompt', question.prompt);
  const label = element('label', 'scholia-response');
  label.append(element('span', '', '我的作答'));
  const textarea = element('textarea');
  textarea.rows = 6;
  textarea.maxLength = 3000;
  textarea.placeholder = '先独立作答；内容只保存在当前浏览器。';
  textarea.value = answers[question.id] || '';
  label.append(textarea);

  const details = element('details', 'chronicle-entry-details scholia-answer');
  const summary = element('summary');
  summary.append(element('span', 'chronicle-expand', '展开参考答案'));
  const comparison = element('div', 'scholia-comparison');
  const own = element('section');
  own.append(element('h4', '', '我的答案'));
  const ownText = element('p', 'scholia-own-answer', textarea.value || '尚未作答。');
  own.append(ownText);
  const reference = element('section');
  reference.append(element('h4', '', '参考答案'), element('p', '', question.answer));
  const points = element('ul', 'scholia-points');
  points.append(...question.points.map(point => element('li', '', point)));
  reference.append(element('h4', '', '得分要点'), points);
  comparison.append(own, reference);
  details.append(summary, comparison);

  let timer;
  textarea.addEventListener('input', () => {
    answers[question.id] = textarea.value;
    ownText.textContent = textarea.value || '尚未作答。';
    clearTimeout(timer);
    timer = setTimeout(() => saveAnswers(answers), 180);
  });
  textarea.addEventListener('blur', () => saveAnswers(answers));
  article.append(heading, prompt, label, details);
  return article;
}

function renderMaterial(material) {
  const article = element('article', 'scholia-material');
  article.append(element('small', '', '本卷原文'), element('h3', '', material.title));
  const verse = element('blockquote');
  verse.append(...material.verse.map(line => element('span', '', line)));
  article.append(verse);
  return article;
}

function renderUnit(material, questions, subject, answers) {
  const unit = element('details', 'scholia-unit');
  const summary = element('summary', 'scholia-unit-summary');
  const heading = element('span', 'scholia-unit-heading');
  heading.append(
    element('small', '', `${subject.label} · 本卷`),
    element('strong', '', material.title)
  );
  summary.append(
    heading,
    element('span', 'scholia-unit-count', `${questions.length} 道题`),
    element('span', 'scholia-unit-action', '＋ 展开')
  );

  const body = element('div', 'scholia-unit-body');
  const questionList = element('div', 'scholia-unit-questions');
  questionList.append(...questions.map(question =>
    renderQuestion(question, material, subject, answers)));
  body.append(renderMaterial(material), questionList);
  unit.append(summary, body);
  return unit;
}

export async function initScholia() {
  const entries = [...document.querySelectorAll('[data-scholia-entry]')];
  const gate = document.querySelector('#scholiaGate');
  const form = document.querySelector('#scholiaGateForm');
  const index = document.querySelector('#scholiaIndex');
  const study = document.querySelector('#scholiaStudy');
  const studyTitle = document.querySelector('#scholiaStudyTitle');
  const studyMark = document.querySelector('#scholiaStudyMark');
  const subjectsHost = document.querySelector('#scholiaSubjects');
  const list = document.querySelector('#scholiaList');
  const count = document.querySelector('#scholiaCount');
  const answers = loadAnswers();
  let data;
  let activeSubject = null;
  let taps = [];
  let origin = 'outer';

  const load = async () => {
    if (data) return data;
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Scholia data request failed: ${response.status}`);
    data = await response.json();
    return data;
  };

  const renderStudy = () => {
    const subject = data.subjects.find(item => item.id === activeSubject);
    if (!subject) return;
    const materials = data.materials.filter(material =>
      material.questions.some(question => question.subject === activeSubject));
    const questionCount = materials.reduce((total, material) => total +
      material.questions.filter(question => question.subject === activeSubject).length, 0);
    studyTitle.textContent = `${subject.label}小室`;
    studyMark.textContent = subject.mark;
    list.replaceChildren(...materials.map(material => renderUnit(
      material,
      material.questions.filter(question => question.subject === activeSubject),
      subject,
      answers
    )));
    list.removeAttribute('aria-busy');
    count.textContent = `${materials.length} 卷 · ${questionCount} 道题 · ${subject.label}`;
    index.hidden = true;
    study.hidden = false;
    study.scrollIntoView({ block:'start' });
  };

  const showIndex = () => {
    activeSubject = null;
    study.hidden = true;
    index.hidden = false;
  };

  const prepare = async () => {
    try {
      await load();
      if (subjectsHost.childElementCount) return;
      subjectsHost.replaceChildren(...data.subjects.map(subject => {
        const button = element('button', 'scholia-subject');
        button.type = 'button';
        button.dataset.subject = subject.id;
        button.setAttribute('aria-label', `进入${subject.label}小室`);
        button.append(element('span', '', subject.mark), element('b', '', subject.label));
        return button;
      }));
      list.removeAttribute('aria-busy');
    } catch (error) {
      console.error(error);
      list.replaceChildren(element('p', 'chronicle-loading', '笺注暂时无法调阅，请稍后重试。'));
    }
  };

  subjectsHost.addEventListener('click', event => {
    const button = event.target.closest('.scholia-subject');
    if (!button) return;
    activeSubject = button.dataset.subject;
    renderStudy();
  });
  list.addEventListener('toggle', event => {
    const unit = event.target;
    if (!(unit instanceof HTMLDetailsElement) ||
        !unit.classList.contains('scholia-unit')) return;
    unit.querySelector('.scholia-unit-action').textContent = unit.open ? '－ 合上' : '＋ 展开';
    if (unit.open) list.querySelectorAll('.scholia-unit[open]').forEach(other => {
      if (other !== unit) other.open = false;
    });
  }, true);
  document.querySelector('#leaveScholiaStudy').addEventListener('click', showIndex);
  entries.forEach(entry => entry.querySelector('.scholia-seal').addEventListener('click', () => {
    const now = Date.now();
    origin = entry.dataset.scholiaEntry;
    taps = [...taps.filter(time => now - time < 3500), now];
    if (taps.length >= 3) {
      taps = [];
      gate.showModal();
    }
  }));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    await prepare();
    gate.close();
    document.dispatchEvent(new CustomEvent('roomrequest', { detail:{ room:'scholia' } }));
  });
  gate.querySelector('.scholia-gate-close').addEventListener('click', () => gate.close());
  document.querySelector('#leaveScholia').addEventListener('click', () => {
    showIndex();
    document.dispatchEvent(new CustomEvent('roomrequest', { detail:{ room:'chronicles', origin } }));
  });
  document.addEventListener('roomchange', event => {
    gate.close();
    taps = [];
    if (event.detail.room === 'scholia') {
      showIndex();
      prepare();
    }
  });

  return {
    showEntry(place, show) {
      const entry = entries.find(item => item.dataset.scholiaEntry === place);
      if (entry) entry.hidden = !show;
    },
    hideEntries() { entries.forEach(entry => { entry.hidden = true; }); }
  };
}
