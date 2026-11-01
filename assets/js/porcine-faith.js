const DATA_URL = './data/porcine-faith.json?v=20261101-faith-3';

function linesHtml(lines) {
  return lines.map(line => line ? `<span>${line}</span>` : '<i aria-hidden="true"></i>').join('');
}

export async function initPorcineFaith() {
  const root = document.querySelector('#faithContent');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Faith data request failed: ${response.status}`);
    const data = await response.json();

    root.innerHTML = `
      <header class="faith-masthead">
        <p class="eyebrow">${data.english}</p>
        <p class="faith-sigil" aria-hidden="true">✦</p>
        <h2>${data.title}</h2>
        <div class="faith-motto" aria-label="${data.motto.join('，')}">
          ${data.motto.map(line => `<span>${line}</span>`).join('')}
        </div>
        <p class="faith-intro">${data.intro}</p>
      </header>

      <section class="faith-altar" aria-labelledby="faithResponseTitle">
        <small>THE GREAT RESPONSE · 大齐诵</small>
        <h3 id="faithResponseTitle">大齐诵</h3>
        <div class="faith-response" id="faithResponse" aria-live="polite">
          ${data.response.map((line, index) => `<p data-response-line="${index}">${line}</p>`).join('')}
        </div>
        <div class="faith-chant-controls">
          <button id="faithChant" type="button">开始齐诵</button>
          <span id="faithChantProgress" aria-live="polite">${data.response.length} 句礼仪词</span>
        </div>
      </section>

      <section class="faith-doctrine" aria-labelledby="faithDoctrineTitle">
        <header class="faith-section-head">
          <div><small>DOCTRINE · 教义</small><h3 id="faithDoctrineTitle">猪教四义</h3></div>
          <p>诸义分卷，各自启合。</p>
        </header>
        <div class="faith-doctrine-list">
          ${data.articles.map(article => `
            <details class="faith-doctrine-item">
              <summary><span>${article.mark}</span><strong>${article.title}</strong><b aria-hidden="true">＋</b></summary>
              <p>${article.body}</p>
            </details>
          `).join('')}
        </div>
      </section>

      <section class="faith-library" aria-labelledby="faithLibraryTitle">
        <header class="faith-section-head">
          <div><small>SCRIPTURES · 经卷</small><h3 id="faithLibraryTitle">礼仪经卷</h3></div>
          <p>圣词、赞颂与祝祷，各卷独立启合。</p>
        </header>
        <div class="faith-scriptures">
          ${data.texts.map((text, index) => `
            <details class="faith-text" id="faith-text-${text.id}" ${index === 0 ? 'open' : ''}>
              <summary>
                <span class="faith-text-mark">${text.mark}</span>
                <div class="faith-text-title"><small>${text.kicker}</small><strong>${text.title}</strong></div>
                <span class="faith-text-ornament" aria-hidden="true">✦</span>
                <b aria-hidden="true">＋</b>
              </summary>
              <div class="faith-verse">${linesHtml(text.lines)}</div>
            </details>
          `).join('')}
        </div>
      </section>

      <footer class="faith-colophon">
        <span aria-hidden="true"></span>
        <p><b>咪咪咪咪。</b><small>众猪应曰：善。</small></p>
        <span aria-hidden="true"></span>
      </footer>
    `;

    let chantIndex = -1;
    const lines = [...root.querySelectorAll('[data-response-line]')];
    const chantButton = root.querySelector('#faithChant');
    const progress = root.querySelector('#faithChantProgress');

    chantButton?.addEventListener('click', () => {
      lines.forEach(line => line.classList.remove('is-active'));
      chantIndex = (chantIndex + 1) % lines.length;
      lines[chantIndex]?.classList.add('is-active');
      progress.textContent = `${chantIndex + 1} / ${lines.length}`;
      chantButton.textContent = chantIndex === lines.length - 1 ? '再诵一遍' : '齐诵下一句';
    });
  } catch (error) {
    console.error(error);
    root.innerHTML = '<p class="faith-error">圣卷暂时无法展开，请稍后再试。</p>';
  }
}
