const DATA_URL = './data/porcine-faith.json?v=20261101-faith-2';

function linesHtml(lines) {
  return lines.map(line => line ? `<span>${line}</span>` : '<i aria-hidden="true"></i>').join('');
}

function openText(root, id) {
  const target = root.querySelector(`#faith-text-${id}`);
  if (!target) return;
  target.open = true;
  target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
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
        <p class="faith-motto">${data.motto}</p>
        <p class="faith-intro">${data.intro}</p>
      </header>

      <section class="faith-altar" aria-labelledby="faithResponseTitle">
        <small>THE GREAT RESPONSE · 大齐诵</small>
        <h3 id="faithResponseTitle">凡我猪者</h3>
        <div class="faith-response" id="faithResponse" aria-live="polite">
          ${data.response.map((line, index) => `<p data-response-line="${index}">${line}</p>`).join('')}
        </div>
        <div class="faith-chant-controls">
          <button id="faithChant" type="button">开始齐诵</button>
          <span id="faithChantProgress" aria-live="polite">四句圣词</span>
        </div>
      </section>

      <section class="faith-doctrine" aria-labelledby="faithDoctrineTitle">
        <header class="faith-section-head">
          <div><small>DOCTRINE · 教义</small><h3 id="faithDoctrineTitle">猪教四义</h3></div>
          <p>默认收起，按需展开。以后新增教义不会把页面无限拉长。</p>
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
          <div><small>SCRIPTURE INDEX · 经卷目录</small><h3 id="faithLibraryTitle">礼仪经卷</h3></div>
          <p>目录负责定位，经卷负责阅读；默认只展开首卷，卷数增加后仍可直接跳转。</p>
        </header>
        <nav class="faith-index" aria-label="猪教经卷目录">
          ${data.texts.map(text => `
            <button type="button" data-faith-text="${text.id}">
              <span>${text.mark}</span><b>${text.title}</b><small>${text.group}</small>
            </button>
          `).join('')}
        </nav>
        <div class="faith-scriptures">
          ${data.texts.map((text, index) => `
            <details class="faith-text" id="faith-text-${text.id}" ${index === 0 ? 'open' : ''}>
              <summary>
                <span>${text.mark}</span>
                <div><small>${text.kicker}</small><strong>${text.title}</strong></div>
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

    root.querySelectorAll('[data-faith-text]').forEach(button => {
      button.addEventListener('click', () => openText(root, button.dataset.faithText));
    });
  } catch (error) {
    console.error(error);
    root.innerHTML = '<p class="faith-error">圣卷暂时无法展开，请稍后再试。</p>';
  }
}
