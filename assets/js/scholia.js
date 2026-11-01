const DATA_URL = './data/scholia.json?v=20261101-scholia-1';
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

export async function initScholia({ onEnter, onExit }) {
  const entry = document.querySelector('#scholiaEntry');
  const seal = document.querySelector('#scholiaSeal');
  const gate = document.querySelector('#scholiaGate');
  const form = document.querySelector('#scholiaGateForm');
  const archive = document.querySelector('#scholiaArchive');
  const subjectsHost = document.querySelector('#scholiaSubjects');
  const list = document.querySelector('#scholiaList');
  const count = document.querySelector('#scholiaCount');
  const answers = loadAnswers();
  let data;
  let activeSubject = 'all';
  let taps = [];

  const load = async () => {
    if (data) return data;
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Scholia data request failed: ${response.status}`);
    data = await response.json();
    return data;
  };

  const render = () => {
    const questions = data.materials.flatMap(material => material.questions
      .filter(question => activeSubject === 'all' || question.subject === activeSubject)
      .map(question => ({ question, material })));
    const subjects = new Map(data.subjects.map(subject => [subject.id, subject]));
    subjectsHost.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.subject === activeSubject));
    });
    list.replaceChildren(...questions.map(({ question, material }) =>
      renderQuestion(question, material, subjects.get(question.subject), answers)));
    list.removeAttribute('aria-busy');
    count.textContent = `${questions.length} 道题 · ${activeSubject === 'all' ? '九科合卷' : subjects.get(activeSubject).label}`;
  };

  const open = async () => {
    gate.close();
    archive.hidden = false;
    onEnter();
    try {
      await load();
      if (!subjectsHost.childElementCount) {
        subjectsHost.replaceChildren(...data.subjects.map(subject => {
          const button = element('button', 'scholia-subject');
          button.type = 'button';
          button.dataset.subject = subject.id;
          button.setAttribute('aria-pressed', String(subject.id === activeSubject));
          button.append(element('span', '', subject.mark), element('b', '', subject.label));
          return button;
        }));
      }
      render();
    } catch (error) {
      console.error(error);
      list.replaceChildren(element('p', 'chronicle-loading', '笺注暂时无法调阅，请稍后重试。'));
    }
    archive.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  subjectsHost.addEventListener('click', event => {
    const button = event.target.closest('.scholia-subject');
    if (!button || button.dataset.subject === activeSubject) return;
    activeSubject = button.dataset.subject;
    render();
  });
  seal.addEventListener('click', () => {
    const now = Date.now();
    taps = [...taps.filter(time => now - time < 3500), now];
    if (taps.length < 3) return;
    taps = [];
    gate.showModal();
  });
  form.addEventListener('submit', event => { event.preventDefault(); open(); });
  gate.querySelector('.scholia-gate-close').addEventListener('click', () => gate.close());
  document.querySelector('#leaveScholia').addEventListener('click', () => {
    archive.hidden = true;
    onExit();
  });
  document.addEventListener('roomchange', event => {
    if (event.detail.room !== 'chronicles') {
      gate.close();
      archive.hidden = true;
      taps = [];
    }
  });

  return {
    showEntry(show) { entry.hidden = !show; },
    hide() { gate.close(); archive.hidden = true; entry.hidden = true; taps = []; }
  };
}
