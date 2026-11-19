import { markdownElement } from './markdown.js?v=20261112-architecture-1';

const DATA_URL = './data/extracurricular.json?v=20261119-extra-2';
const STORAGE_KEY = 'vesperion-extracurricular-answers-v1';

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
  catch { /* Answers remain usable in-memory if storage is unavailable. */ }
}

function renderMaterial(material) {
  const article = element('article', 'scholia-material');
  article.append(element('small', '', material.kicker || '课外材料'), element('h3', '', material.title));
  (material.body || []).forEach(paragraph => article.append(markdownElement('p', 'markdown-content', paragraph)));
  return article;
}

function renderQuestion(question, material, subject, answers) {
  const article = element('article', 'scholia-question');
  const heading = element('header', 'scholia-question-heading');
  heading.append(
    element('span', 'scholia-subject-mark', subject.mark),
    element('small', '', `${subject.label} · ${material.title}`),
    element('h3', '', question.title)
  );
  const prompt = markdownElement('div', 'scholia-prompt markdown-content', question.prompt);
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
  reference.append(element('h4', '', '参考答案'), markdownElement('div', 'markdown-content', question.answer));
  const points = element('ul', 'scholia-points');
  points.append(...question.points.map(point => markdownElement('li', 'markdown-inline', point, true)));
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

function renderUnit(material, questions, subject, answers) {
  const unit = element('details', 'scholia-unit');
  const summary = element('summary', 'scholia-unit-summary');
  const heading = element('span', 'scholia-unit-heading');
  heading.append(element('small', '', `${subject.label} · 课外材料`), element('strong', '', material.title));
  summary.append(
    heading,
    element('span', 'scholia-unit-count', `${questions.length} 道题`),
    element('span', 'scholia-unit-action', '＋ 展开')
  );
  const body = element('div', 'scholia-unit-body');
  const questionList = element('div', 'scholia-unit-questions');
  questionList.append(...questions.map(question => renderQuestion(question, material, subject, answers)));
  body.append(renderMaterial(material), questionList);
  unit.append(summary, body);
  return unit;
}

let ready = false;

export async function initExtracurricular() {
  if (ready) return;
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`Extracurricular data request failed: ${response.status}`);
  const data = await response.json();
  const subjectsHost = document.querySelector('#extracurricularSubjects');
  const index = document.querySelector('#extracurricularIndex');
  const study = document.querySelector('#extracurricularStudy');
  const studyTitle = document.querySelector('#extracurricularStudyTitle');
  const studyMark = document.querySelector('#extracurricularStudyMark');
  const count = document.querySelector('#extracurricularCount');
  const list = document.querySelector('#extracurricularList');
  const answers = loadAnswers();
  let activeSubject = null;

  const showIndex = () => {
    activeSubject = null;
    study.hidden = true;
    index.hidden = false;
  };

  const renderStudy = () => {
    const subject = data.subjects.find(item => item.id === activeSubject);
    if (!subject) return;
    const materials = data.materials.filter(material =>
      material.questions.some(question => question.subject === activeSubject));
    const questionCount = materials.reduce((total, material) =>
      total + material.questions.filter(question => question.subject === activeSubject).length, 0);
    studyTitle.textContent = `${subject.label}小室`;
    studyMark.textContent = subject.mark;
    if (materials.length) {
      list.replaceChildren(...materials.map(material => renderUnit(
        material,
        material.questions.filter(question => question.subject === activeSubject),
        subject,
        answers
      )));
    } else {
      const emptyNotes = {
        mathematics:'数卷尚静。待有值得建模、推演或证明的材料，再请入室。',
        english:'英卷未开。待有真正适合阅读、表达或语用考查的材料，再行装订。',
        physics:'理卷无题。未见可落回物理模型与定律的材料，馆员暂不强解。',
        biology:'生卷暂空。待材料能落到结构、功能、调节或生态关系，再作笺注。',
        politics:'政卷未录。待材料确有可据的概念、原理与规范设问，再收入卷中。',
        history:'史卷尚阙。待材料具备可考史实、时序或因果关系，再启此卷。',
        geography:'地卷未展。待材料能落到空间、过程、区域或人地关系，再来问地。',
        chinese:'语卷尚静。待有值得辨析的文本、语言或逻辑材料，再请入室。',
        chemistry:'化卷暂空。待材料能落到真实结构、反应或规律，再行设问。'
      };
      const empty = element('div', 'extracurricular-empty');
      empty.append(
        element('small', '', '此卷未启'),
        element('p', '', emptyNotes[subject.id] || '此科尚无合适材料，馆员暂不强作笺注。')
      );
      list.replaceChildren(empty);
    }
    list.removeAttribute('aria-busy');
    count.textContent = `${materials.length} 卷 · ${questionCount} 道题 · ${subject.label}`;
    index.hidden = true;
    study.hidden = false;
    study.scrollIntoView({ block:'start' });
  };

  subjectsHost.replaceChildren(...data.subjects.map(subject => {
    const button = element('button', 'scholia-subject');
    button.type = 'button';
    button.dataset.subject = subject.id;
    button.setAttribute('aria-label', `进入${subject.label}小室`);
    button.append(element('span', '', subject.mark), element('b', '', subject.label));
    return button;
  }));

  subjectsHost.addEventListener('click', event => {
    const button = event.target.closest('.scholia-subject');
    if (!button?.dataset.subject) return;
    activeSubject = button.dataset.subject;
    renderStudy();
  });
  list.addEventListener('toggle', event => {
    const unit = event.target;
    if (!(unit instanceof HTMLDetailsElement) || !unit.classList.contains('scholia-unit')) return;
    unit.querySelector('.scholia-unit-action').textContent = unit.open ? '－ 合上' : '＋ 展开';
    if (unit.open) list.querySelectorAll('.scholia-unit[open]').forEach(other => {
      if (other !== unit) other.open = false;
    });
  }, true);
  document.querySelector('#leaveExtracurricularStudy').addEventListener('click', showIndex);
  document.addEventListener('roomchange', event => {
    if (event.detail.room === 'extracurricular') showIndex();
  });
  showIndex();
  ready = true;
}
