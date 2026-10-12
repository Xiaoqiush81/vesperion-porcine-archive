// Artwork is independent of filtering, dialog state and the page theme.
// Every specimen owns one compressed portrait asset, derived from its stable id.

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function specimenArt(specimen) {
  const artwork = typeof specimen.artwork === 'string'
    && /^assets\/[\w./-]+\.(?:webp|png|jpe?g)$/i.test(specimen.artwork)
    ? specimen.artwork
    : `assets/cards/${escapeHtml(specimen.id.toLowerCase())}.webp`;
  return `<span class="card-art has-image" aria-hidden="true">
    <img class="art-image" src="${artwork}" alt="" width="640" height="960" loading="lazy" decoding="async">
    <span class="art-index">№ ${escapeHtml(specimen.number)}</span>
    <span class="art-caption"><span>${escapeHtml(specimen.category)}</span><span>VESPERION · 081</span></span>
  </span>`;
}
