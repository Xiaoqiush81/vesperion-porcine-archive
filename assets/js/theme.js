const STORAGE_KEY = 'pigdex-theme';
const THEMES = Object.freeze({ paper:'#f3efe5', night:'#10263d', signal:'#05080b' });
const SECRET_TAPS = 4;
const TAP_WINDOW = 1500;

function readSavedTheme() {
  try { return localStorage.getItem(STORAGE_KEY); }
  catch { return null; }
}

function saveTheme(theme) {
  try { localStorage.setItem(STORAGE_KEY, theme); }
  catch { /* The theme still works when storage is unavailable. */ }
}

function playHandoff(onComplete) {
  const overlay = document.querySelector('#signalHandoff');
  if (!overlay || matchMedia('(prefers-reduced-motion: reduce)').matches) return onComplete();
  const status = overlay.querySelector('#signalStatus');
  overlay.classList.remove('is-leaving');
  overlay.classList.add('is-active');
  document.body.classList.add('signal-switching');
  status.textContent = '正在校准馆藏频段…';
  setTimeout(() => { status.textContent = '捕获未知节点 // 正在核验…'; }, 520);
  setTimeout(onComplete, 970);
  setTimeout(() => { status.textContent = 'ACCESS GRANTED // 081'; }, 1120);
  setTimeout(() => overlay.classList.add('is-leaving'), 1460);
  setTimeout(() => {
    overlay.classList.remove('is-active', 'is-leaving');
    document.body.classList.remove('signal-switching');
  }, 1810);
}

export function initTheme(toggle, secretTrigger) {
  let lastBase = 'paper';
  function apply(theme, persist = true) {
    const next = theme in THEMES ? theme : 'paper';
    if (next !== 'signal') lastBase = next;
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]').content = THEMES[next];
    toggle.setAttribute('aria-pressed', String(next === 'night'));
    toggle.setAttribute('aria-label', next === 'night' ? '切换为象牙白主题' : '切换为深蓝主题');
    if (persist) saveTheme(next);
    document.dispatchEvent(new CustomEvent('themechange', { detail:{ theme:next } }));
  }

  const initial = readSavedTheme();
  apply(initial in THEMES ? initial : 'paper', false);
  toggle.addEventListener('click', () => {
    apply(document.documentElement.dataset.theme === 'night' ? 'paper' : 'night');
  });

  if (!secretTrigger) return;
  let taps = 0, timer;
  secretTrigger.addEventListener('click', () => {
    taps += 1;
    secretTrigger.classList.toggle('is-listening', taps > 1);
    clearTimeout(timer);
    timer = setTimeout(() => { taps = 0; secretTrigger.classList.remove('is-listening'); }, TAP_WINDOW);
    if (taps < SECRET_TAPS) return;
    clearTimeout(timer); taps = 0; secretTrigger.classList.remove('is-listening');
    const entering = document.documentElement.dataset.theme !== 'signal';
    playHandoff(() => apply(entering ? 'signal' : lastBase));
  });
}
