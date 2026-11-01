const DATA_URL = './data/porcine-faith.json?v=20261101-faith-4';
const MEMBER_KEY = 'pigdex-faith-member-v1';

function linesHtml(lines) {
  return lines.map(line => line ? `<span>${line}</span>` : '<i aria-hidden="true"></i>').join('');
}

function readMember() {
  try {
    const value = JSON.parse(localStorage.getItem(MEMBER_KEY) || 'null');
    return value?.active ? value : null;
  } catch {
    return null;
  }
}

function writeMember(member) {
  try {
    if (member) localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
    else localStorage.removeItem(MEMBER_KEY);
  } catch {}
  document.documentElement.dataset.faithMember = member ? 'true' : 'false';
  document.dispatchEvent(new CustomEvent('faithmembershipchange', { detail:{ active:Boolean(member) } }));
}

function dailyIndex(length) {
  if (!length) return 0;
  const today = new Date();
  const stamp = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000;
  return Math.abs(Math.trunc(stamp)) % length;
}

function membershipHtml(data, member) {
  if (!member) {
    return `
      <section class="faith-membership faith-membership-visitor" aria-labelledby="faithMembershipTitle">
        <div class="faith-membership-copy">
          <small>PORCINE MEMBERSHIP · 教籍</small>
          <h3 id="faithMembershipTitle">${data.membership.visitorTitle}</h3>
          <p>${data.membership.visitorText}</p>
        </div>
        <button id="faithJoinStart" class="faith-membership-action" type="button">${data.membership.joinLabel}</button>
        <div class="faith-ceremony" id="faithCeremony" hidden>
          <small>RITE OF ADMISSION · 入教仪式</small>
          <div class="faith-oath">${data.membership.oath.map(line => `<p>${line}</p>`).join('')}</div>
          <button id="faithJoinConfirm" type="button">我猪愿入教</button>
        </div>
      </section>
    `;
  }

  const oracle = data.memberRites?.[0];
  const oracleLine = oracle?.lines?.[dailyIndex(oracle.lines.length)] || '圣火照路，猪自徐行。';
  const inner = data.memberRites?.[1];

  return `
    <section class="faith-membership faith-membership-member" aria-labelledby="faithMembershipTitle">
      <div class="faith-member-seal" aria-hidden="true"><span>✦</span><b>081</b></div>
      <div class="faith-membership-copy">
        <small>${data.membership.memberMark}</small>
        <h3 id="faithMembershipTitle">${data.membership.memberTitle}</h3>
        <p>${data.membership.memberText}</p>
        <p class="faith-member-date">入教于 ${new Intl.DateTimeFormat('zh-CN', { dateStyle:'long' }).format(new Date(member.joinedAt))}</p>
      </div>
      <button id="faithLeave" class="faith-membership-leave" type="button">${data.membership.leaveLabel}</button>
    </section>

    <section class="faith-inner-rites" aria-label="教籍猪专属礼仪">
      <article class="faith-oracle">
        <small>${oracle?.kicker || 'DAILY PORCINE ORACLE'}</small>
        <h3>${oracle?.title || '今日猪谕'}</h3>
        <p>${oracleLine}</p>
        <span>本日一签 · 明日再启</span>
      </article>
      <details class="faith-inner-response">
        <summary><div><small>${inner?.kicker || 'INNER CHAPEL RESPONSE'}</small><strong>${inner?.title || '内坛应答'}</strong></div><b aria-hidden="true">＋</b></summary>
        <div>${(inner?.lines || []).map(line => `<p>${line}</p>`).join('')}</div>
      </details>
    </section>
  `;
}

function renderFaith(root, data) {
  const member = readMember();

  root.innerHTML = `
    <header class="faith-masthead">
      <p class="eyebrow">${data.english}</p>
      <p class="faith-sigil" aria-hidden="true">✦</p>
      <h2>${data.title}</h2>
      <div class="faith-motto" aria-label="${data.motto.join('，')}">
        ${data.motto.map(line => `<span>${line}</span>`).join('')}
      </div>
      <p class="faith-intro">${data.intro}</p>
      ${member ? '<p class="faith-masthead-member">✦ 教籍猪已归坛 ✦</p>' : ''}
    </header>

    ${membershipHtml(data, member)}

    <section class="faith-altar" aria-labelledby="faithResponseTitle">
      <small>THE GREAT RESPONSE · 大齐诵</small>
      <h3 id="faithResponseTitle">大齐诵</h3>
      <div class="faith-response" id="faithResponse" aria-live="polite">
        ${data.response.map((line, index) => `<p data-response-line="${index}">${line}</p>`).join('')}
      </div>
      <div class="faith-chant-controls">
        <button id="faithChant" type="button">${member ? '教籍猪领诵' : '开始齐诵'}</button>
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
      <p><b>${member ? '教籍既立，猪道长明。' : '咪咪咪咪。'}</b><small>${member ? 'PORCINE MEMBER · №081' : '众猪应曰：善。'}</small></p>
      <span aria-hidden="true"></span>
    </footer>
  `;

  root.querySelector('#faithJoinStart')?.addEventListener('click', () => {
    const ceremony = root.querySelector('#faithCeremony');
    ceremony.hidden = false;
    ceremony.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'center' });
  });

  root.querySelector('#faithJoinConfirm')?.addEventListener('click', () => {
    writeMember({ active:true, joinedAt:new Date().toISOString(), mark:'081' });
    renderFaith(root, data);
    root.querySelector('.faith-membership-member')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'center' });
  });

  root.querySelector('#faithLeave')?.addEventListener('click', () => {
    writeMember(null);
    renderFaith(root, data);
    root.querySelector('.faith-membership-visitor')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'center' });
  });

  let chantIndex = -1;
  const lines = [...root.querySelectorAll('[data-response-line]')];
  const chantButton = root.querySelector('#faithChant');
  const progress = root.querySelector('#faithChantProgress');

  chantButton?.addEventListener('click', () => {
    lines.forEach(line => line.classList.remove('is-active'));
    chantIndex = (chantIndex + 1) % lines.length;
    lines[chantIndex]?.classList.add('is-active');
    progress.textContent = `${chantIndex + 1} / ${lines.length}`;
    chantButton.textContent = chantIndex === lines.length - 1 ? '再诵一遍' : (member ? '教籍猪续诵' : '齐诵下一句');
  });
}

export async function initPorcineFaith() {
  const root = document.querySelector('#faithContent');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Faith data request failed: ${response.status}`);
    renderFaith(root, await response.json());
  } catch (error) {
    console.error(error);
    root.innerHTML = '<p class="faith-error">圣卷暂时无法展开，请稍后再试。</p>';
  }
}
