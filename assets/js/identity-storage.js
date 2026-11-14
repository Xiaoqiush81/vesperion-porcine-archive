const HISTORY = 'vesperion-identity-history';
const LAST = 'vesperion-identity-last-questions';
const SESSION = 'vesperion-identity-session-v1';
const LIMIT = 8;

function read(key, fallback, storage = globalThis.localStorage) {
  try { return JSON.parse(storage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

export function loadIdentityHistory(storage) {
  const value = read(HISTORY, [], storage);
  return Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string'
    && typeof item.name === 'string' && typeof item.rarity === 'string'
    && typeof item.at === 'string' && Number.isFinite(Date.parse(item.at))).slice(0, LIMIT) : [];
}

export function addIdentityRecord(specimen, storage = globalThis.localStorage) {
  const history = [{ id:specimen.id, name:specimen.name, rarity:specimen.rarity, at:new Date().toISOString() }, ...loadIdentityHistory(storage)].slice(0, LIMIT);
  try { storage.setItem(HISTORY, JSON.stringify(history)); return { ok:true, history }; }
  catch { return { ok:false, history:loadIdentityHistory(storage) }; }
}

export function loadLastQuestionIds(storage) {
  const value = read(LAST, [], storage);
  return Array.isArray(value) ? value.filter(id => typeof id === 'string') : [];
}

export function saveLastQuestionIds(ids, storage = globalThis.localStorage) {
  try { storage.setItem(LAST, JSON.stringify(ids)); return true; }
  catch { return false; }
}

export const loadIdentitySession = storage => read(SESSION, null, storage);

export function saveIdentitySession(session, storage = globalThis.localStorage) {
  try {
    if (session) storage.setItem(SESSION, JSON.stringify(session));
    else storage.removeItem(SESSION);
    return true;
  } catch { return false; }
}
