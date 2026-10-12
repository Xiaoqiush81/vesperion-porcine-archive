// Artwork is independent of filtering, dialog state and the page theme.
// Optional local `artwork` paths can replace the shared archive illustration.
const ARCHIVE_TEXTURE = 'assets/card-archive-texture.webp';

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function specimenArt(specimen) {
  const artwork = typeof specimen.artwork === 'string'
    && /^assets\/[\w./-]+\.(?:webp|png|jpe?g)$/i.test(specimen.artwork)
    ? specimen.artwork : ARCHIVE_TEXTURE;
  const code = escapeHtml(specimen.number.replace('081-', ''));
  return `<span class="card-art has-image" aria-hidden="true">
    <img class="art-image" src="${artwork}" alt="" width="800" height="800" loading="lazy" decoding="async">
    <span class="art-index">№ ${escapeHtml(specimen.number)}</span>
    ${artwork === ARCHIVE_TEXTURE ? `<span class="art-orbit"></span>
      <svg class="art-glyph" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M28 43 22 14 48 27M72 27 98 14 92 43" fill="#10263d" stroke="currentColor" stroke-width="1.4"/>
        <path d="M60 27C32 27 18 44 18 67c0 26 18 42 42 42s42-16 42-42C102 44 88 27 60 27Z" fill="#10263d" stroke="currentColor" stroke-width="1.4"/>
        <path d="m60 10 2.5 5.5L68 18l-5.5 2.5L60 26l-2.5-5.5L52 18l5.5-2.5Z" fill="#d8bb83"/>
        <text x="60" y="75" fill="currentColor" stroke="none" text-anchor="middle" font-family="Georgia,serif" font-size="${code.length > 5 ? 17 : 23}">${code}</text>
        <path d="M52 89h16" stroke="currentColor"/>
      </svg>` : ''}
    <span class="art-caption"><span>${escapeHtml(specimen.category)}</span><span>VESPERION · 081</span></span>
  </span>`;
}
