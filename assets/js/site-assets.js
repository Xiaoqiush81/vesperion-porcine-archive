export const SITE_ASSETS = Object.freeze({
  favicon:'https://files.catbox.moe/m3epbd.png',
  music:'',
  effects:Object.freeze({ flip:'', favorite:'', door:'', pig:'', theme:'', tap:'' })
});

export function resolveAsset(value, fallback = '', base = import.meta.url) {
  const source = typeof value === 'string' && value.trim() ? value.trim() : fallback;
  if (!source) return '';
  try {
    const url = new URL(source, base);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
