const HISTORY_KEY = 'vesperion-tarot-history';
const HISTORY_LIMIT = 20;

function sanitizeRecord(entry) {
  if (!entry || typeof entry !== 'object' || !Array.isArray(entry.cards)) return null;
  return {
    createdAt:String(entry.createdAt || ''),
    question:String(entry.question || '').slice(0, 80),
    spreadId:String(entry.spreadId || entry.spread || ''),
    cards:entry.cards.slice(0, 14).map(item => ({
      name:String(item?.name || ''),
      title:String(item?.title || ''),
      reversed:Boolean(item?.reversed),
      position:String(item?.position || '')
    })),
    note:String(entry.note || '').slice(0, 500)
  };
}

export function loadReadingHistory(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(HISTORY_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, HISTORY_LIMIT).map(sanitizeRecord).filter(Boolean);
  } catch {
    return [];
  }
}

export function addReadingRecord(record, storage = globalThis.localStorage) {
  const clean = sanitizeRecord(record);
  if (!clean) return { ok:false, history:loadReadingHistory(storage) };
  const history = [clean, ...loadReadingHistory(storage)].slice(0, HISTORY_LIMIT);
  try {
    storage.setItem(HISTORY_KEY, JSON.stringify(history));
    return { ok:true, history };
  } catch {
    return { ok:false, history:loadReadingHistory(storage) };
  }
}
