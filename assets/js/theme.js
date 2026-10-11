const STORAGE_KEY = 'pigdex-theme';
const THEMES = Object.freeze({ paper: '#f3efe5', night: '#10263d' });

function readSavedTheme() {
  try { return localStorage.getItem(STORAGE_KEY); }
  catch { return null; }
}

function saveTheme(theme) {
  try { localStorage.setItem(STORAGE_KEY, theme); }
  catch { /* The theme still works when storage is unavailable. */ }
}

export function initTheme(toggle) {
  function apply(theme, persist = true) {
    const next = theme in THEMES ? theme : 'paper';
    const isNight = next === 'night';
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]').content = THEMES[next];
    toggle.setAttribute('aria-pressed', String(isNight));
    toggle.setAttribute('aria-label', isNight ? '切换为象牙白主题' : '切换为深蓝主题');
    if (persist) saveTheme(next);
  }

  apply(readSavedTheme() || 'paper', false);
  toggle.addEventListener('click', () => {
    apply(document.documentElement.dataset.theme === 'night' ? 'paper' : 'night');
  });
}
