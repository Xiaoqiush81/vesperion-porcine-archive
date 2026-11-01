const DATA_URL = './data/porcine-faith.json?v=20261101-faith-1';

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
        <p class="faith-motto">${data.motto}</p>
        <p class="faith-intro">${data.intro}</p>
      </header>

      <section class="faith-altar" aria-labelledby="faithChorusTitle">
        <small>THE GREAT RESPONSE · 大齐诵</small>
        <h3 id="faithChorusTitle">凡我猪者</h3>
        <p id="faithResponse" aria-live="polite">${data.chorus[0]}</p>
        <button id="faithChant" type="button">齐诵下一句</button>
      </section>

      <section class="faith-articles" aria-label="猪教四义">
        ${data.articles.map(article => `
          <article><span>${article.mark}</span><h3>${article.title}</h3><p>${article.body}</p></article>
        `).join('')}
      </section>

      <section class="faith-scriptures" aria-label="猪教礼仪经卷">
        ${data.texts.map((text, index) => `
          <details class="faith-text" ${index === 0 ? 'open' : ''}>
            <summary>
              <span>${text.mark}</span>
              <div><small>${text.kicker}</small><strong>${text.title}</strong></div>
              <b aria-hidden="true">＋</b>
            </summary>
            <div class="faith-verse">${linesHtml(text.lines)}</div>
          </details>
        `).join('')}
      </section>

      <footer class="faith-colophon">
        <span aria-hidden="true"></span>
        <p><b>咪咪咪咪。</b><small>众猪应曰：善。</small></p>
        <span aria-hidden="true"></span>
      </footer>
    `;

    let chorusIndex = 0;
    root.querySelector('#faithChant')?.addEventListener('click', () => {
      chorusIndex = (chorusIndex + 1) % data.chorus.length;
      root.querySelector('#faithResponse').textContent = data.chorus[chorusIndex];
    });
  } catch (error) {
    console.error(error);
    root.innerHTML = '<p class="faith-error">圣卷暂时无法展开，请稍后再试。</p>';
  }
}
