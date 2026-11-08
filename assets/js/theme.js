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
  let cardTimer = 0;

  function shiftSignalCard() {
    if (toggle.classList.contains('is-card-shifting')) return;
    const next = !toggle.classList.contains('is-signal-flipped');
    toggle.classList.add('is-card-shifting');
    clearTimeout(cardTimer);
    cardTimer = setTimeout(() => {
      toggle.classList.toggle('is-signal-flipped', next);
      toggle.setAttribute('aria-label', next ? '切换至身份卡正面' : '切换至身份档案面');
    }, 150);
    cardTimer = setTimeout(() => toggle.classList.remove('is-card-shifting'), 470);
  }

  function apply(theme, persist = true) {
    const next = theme in THEMES ? theme : 'paper';
    if (next !== 'signal') lastBase = next;
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]').content = THEMES[next];
    toggle.setAttribute('aria-pressed', String(next === 'night'));
    if (next !== 'signal') toggle.classList.remove('is-signal-flipped', 'is-card-shifting');
    toggle.setAttribute('aria-label', next === 'signal' ? '切换至身份档案面' : next === 'night' ? '切换为象牙白主题' : '切换为深蓝主题');
    if (persist) saveTheme(next);
    document.dispatchEvent(new CustomEvent('themechange', { detail:{ theme:next } }));
  }

  const initial = readSavedTheme();
  apply(initial in THEMES ? initial : 'paper', false);
  toggle.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme;
    if (current === 'signal') shiftSignalCard();
    else apply(current === 'night' ? 'paper' : 'night');
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
