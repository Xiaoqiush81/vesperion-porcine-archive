const STORAGE_KEY = 'pigdex-favorites-v1';
const TYPES = Object.freeze(['specimens', 'tarot']);

const emptyState = () => ({ specimens: [], tarot: [] });

export function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return Object.fromEntries(TYPES.map(type => [type, [...new Set(Array.isArray(saved[type]) ? saved[type].filter(Boolean) : [])]]));
  } catch {
    return emptyState();
  }
}

export function isFavorite(type, id) {
  return TYPES.includes(type) && loadFavorites()[type].includes(id);
}

export function toggleFavorite(type, id) {
  if (!TYPES.includes(type) || !id) return false;
  const favorites = loadFavorites();
  const selected = new Set(favorites[type]);
  const active = !selected.has(id);
  active ? selected.add(id) : selected.delete(id);
  favorites[type] = [...selected];
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)); } catch { /* Private browsing can disable storage. */ }
  window.dispatchEvent(new CustomEvent('pigdex:favorites', { detail: { type, id, active, favorites } }));
  return active;
}
