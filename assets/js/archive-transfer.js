const FORMAT = 'vesperion-porcine-archive';
const VERSION = 1;
const MAX_FILE_SIZE = 1024 * 1024;
const KEYS = Object.freeze({
  favorites:'pigdex-favorites-v1', identityHistory:'vesperion-identity-history',
  identityQuestions:'vesperion-identity-last-questions', tarotHistory:'vesperion-tarot-history',
  theme:'pigdex-theme', audio:'pigdex-audio-v1'
});

const arrayOfStrings = (value, limit = 500) => Array.isArray(value)
  ? [...new Set(value.slice(0, limit).filter(item => typeof item === 'string' && item.length <= 160))]
  : [];
const text = (value, limit) => String(value ?? '').slice(0, limit);
const readJson = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };

function reading(entry) {
  if (!entry || typeof entry !== 'object' || !Array.isArray(entry.cards)) return null;
  return {
    createdAt:text(entry.createdAt, 40), question:text(entry.question, 80), spreadId:text(entry.spreadId || entry.spread, 80),
    cards:entry.cards.slice(0, 14).map(card => ({ name:text(card?.name,80), title:text(card?.title,80), reversed:Boolean(card?.reversed), position:text(card?.position,80) })),
    note:text(entry.note, 500)
  };
}

function createArchive() {
  const favorites = readJson(KEYS.favorites, {}), audio = readJson(KEYS.audio, {});
  return {
    format:FORMAT, version:VERSION, exportedAt:new Date().toISOString(),
    data:{
      favorites:{ specimens:arrayOfStrings(favorites.specimens), tarot:arrayOfStrings(favorites.tarot) },
      identity:{ history:readJson(KEYS.identityHistory, []), lastQuestions:arrayOfStrings(readJson(KEYS.identityQuestions, []), 100) },
      tarot:{ history:readJson(KEYS.tarotHistory, []) },
      preferences:{ theme:localStorage.getItem(KEYS.theme) || 'paper', audio }
    }
  };
}

function normalizeArchive(archive) {
  if (!archive || archive.format !== FORMAT || archive.version !== VERSION || !archive.data) throw new Error('这不是可识别的宅邸档案。');
  const { favorites = {}, identity = {}, tarot = {}, preferences = {} } = archive.data;
  const history = Array.isArray(identity.history) ? identity.history.slice(0, 8).filter(item => item && typeof item === 'object').map(item => ({
    id:text(item.id,80), name:text(item.name,80), rarity:text(item.rarity,40), at:text(item.at,40)
  })).filter(item => item.id && item.name) : [];
  const readings = Array.isArray(tarot.history) ? tarot.history.slice(0, 20).map(reading).filter(Boolean) : [];
  const theme = preferences.theme === 'night' ? 'night' : 'paper';
  const sourceAudio = preferences.audio && typeof preferences.audio === 'object' ? preferences.audio : {};
  const volume = (value, fallback) => Number.isFinite(Number(value)) ? Math.min(1, Math.max(0, Number(value))) : fallback;
  return new Map([
    [KEYS.favorites, JSON.stringify({ specimens:arrayOfStrings(favorites.specimens), tarot:arrayOfStrings(favorites.tarot) })],
    [KEYS.identityHistory, JSON.stringify(history)],
    [KEYS.identityQuestions, JSON.stringify(arrayOfStrings(identity.lastQuestions, 100))],
    [KEYS.tarotHistory, JSON.stringify(readings)],
    [KEYS.theme, theme],
    [KEYS.audio, JSON.stringify({ music:Boolean(sourceAudio.music), effects:Boolean(sourceAudio.effects), musicVolume:volume(sourceAudio.musicVolume,.65), effectsVolume:volume(sourceAudio.effectsVolume,.5) })]
  ]);
}

function replaceStorage(entries) {
  const previous = new Map([...entries.keys()].map(key => [key, localStorage.getItem(key)]));
  try { entries.forEach((value, key) => localStorage.setItem(key, value)); }
  catch (error) {
    previous.forEach((value, key) => { try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch {} });
    throw error;
  }
}

function downloadArchive() {
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(createArchive(), null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `pigdex-081-archive-${stamp}.json`;
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function initArchiveTransfer(root = document) {
  const exportButton = root.querySelector('#exportArchive'), importButton = root.querySelector('#importArchive');
  const input = root.querySelector('#archiveFile'), status = root.querySelector('#archiveTransferStatus');
  if (!exportButton || exportButton.dataset.ready === 'true') return;
  exportButton.dataset.ready = 'true';
  exportButton.addEventListener('click', () => { try { downloadArchive(); status.textContent = '宅邸档案已交付浏览器下载。'; } catch { status.textContent = '导出失败：浏览器拒绝了文件下载。'; } });
  importButton.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files?.[0]; input.value = '';
    if (!file) return;
    try {
      if (file.size > MAX_FILE_SIZE) throw new Error('档案超过 1MB，已拒绝读取。');
      const entries = normalizeArchive(JSON.parse(await file.text()));
      if (!window.confirm('导入会替换当前设备上的收藏、鉴定、占卜与偏好记录。确认继续吗？')) return;
      replaceStorage(entries);
      status.textContent = '档案已恢复，正在重新装订馆舍…';
      window.setTimeout(() => location.reload(), 450);
    } catch (error) { status.textContent = `导入失败：${error instanceof Error ? error.message : '文件内容无效。'}`; }
  });
}
