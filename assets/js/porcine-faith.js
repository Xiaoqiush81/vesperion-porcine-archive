const DATA_URL = './data/porcine-faith.json?v=20261101-faith-7';
const ORACLE_URL = './data/porcine-oracles.json?v=20261101-faith-7';
const MEMBER_KEY = 'pigdex-faith-member-v1';
const ORACLE_KEY = 'pigdex-faith-oracle-v1';

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

function localDayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function readOracleState() {
  try {
    const value = JSON.parse(localStorage.getItem(ORACLE_KEY) || 'null');
    return value && typeof value === 'object' ? value : { used:[], history:[], today:null };
  } catch {
    return { used:[], history:[], today:null };
  }
}

function writeOracleState(state) {
  try { localStorage.setItem(ORACLE_KEY, JSON.stringify(state)); } catch {}
}

function randomIndex(length) {
  if (length <= 1) return 0;
  if (globalThis.crypto?.getRandomValues) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] % length;
  }
  return Math.floor(Math.random() * length);
}

function drawOracle(entries) {
  const day = localDayKey();
  const state = readOracleState();
  if (state.today?.date === day) return { state, entry:entries.find(item => item.id === state.today.id) || null };

  const knownIds = new Set(entries.map(item => item.id));
  let used = Array.isArray(state.used) ? state.used.filter(id => knownIds.has(id)) : [];
  let remaining = entries.filter(item => !used.includes(item.id));
  if (!remaining.length) {
    used = [];
    remaining = [...entries];
  }

  const entry = remaining[randomIndex(remaining.length)];
  used.push(entry.id);
  const history = [{ date:day, id:entry.id }, ...(Array.isArray(state.history) ? state.history : [])]
    .filter((item, index, list) => list.findIndex(other => other.date === item.date) === index)
    .slice(0, 60);
  const next = { used, history, today:{ date:day, id:entry.id } };
  writeOracleState(next);
  return { state:next, entry };
}

function currentOracle(entries) {
  const state = readOracleState();
  if (state.today?.date !== localDayKey()) return { state, entry:null };
  return { state, entry:entries.find(item => item.id === state.today.id) || null };
}

function oracleHistoryHtml(entries, state) {
  const map = new Map(entries.map(item => [item.id, item]));
  const rows = (state.history || []).map(record => ({ ...record, entry:map.get(record.id) })).filter(row => row.entry);
  if (!rows.length) return '<p class="faith-oracle-empty">尚无开签记录。第一签会从今天开始归档。</p>';
  return rows.map(row => `
    <li>
      <time datetime="${row.date}">${row.date}</time>
      <span>${row.entry.tag}</span>
      <p>${row.entry.text}</p>
    </li>
  `).join('');
}

function membershipHtml(data, member, oracleData) {
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

  const inner = data.memberRites?.[0];
  const current = currentOracle(oracleData.entries);
  const hasToday = Boolean(current.entry);

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
      <article class="faith-oracle ${hasToday ? 'is-opened' : 'is-sealed'}" id="faithOracle">
        <small>DAILY PORCINE ORACLE · 每日猪谕</small>
        <h3>${hasToday ? '今日猪谕' : '今日一签尚未开启'}</h3>
        <div class="faith-oracle-result" id="faithOracleResult" aria-live="polite">
          ${hasToday
            ? `<span>${current.entry.tag} · ${current.entry.id}</span><p>${current.entry.text}</p>`
            : '<span>SEALED · 一日一签</span><p>今日尚未开签。启封以后，本日签文不可重抽。</p>'}
        </div>
        ${hasToday
          ? '<em>本日已启 · 明日再来</em>'
          : '<button id="faithOracleDraw" type="button">开今日一签</button>'}
      </article>

      <details class="faith-inner-response">
        <summary><div><small>${inner?.kicker || 'INNER CHAPEL RESPONSE'}</small><strong>${inner?.title || '内坛应答'}</strong></div><b aria-hidden="true">＋</b></summary>
        <div>${(inner?.lines || []).map(line => `<p>${line}</p>`).join('')}</div>
      </details>
    </section>

    <details class="faith-oracle-library">
      <summary>
        <div><small>${oracleData.english}</small><strong>猪谕簿</strong></div>
        <span>${current.state.history?.length || 0} 签已归档</span>
        <b aria-hidden="true">＋</b>
      </summary>
      <div class="faith-oracle-library-body">
        <p>文库共 ${oracleData.entries.length} 签。未抽完一轮前优先避开已出现签文；全部走完后才开启新一轮。</p>
        <ol id="faithOracleHistory">${oracleHistoryHtml(oracleData.entries, current.state)}</ol>
      </div>
    </details>
  `;
}

function renderFaith(root, data, oracleData) {
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

    ${membershipHtml(data, member, oracleData)}

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
    renderFaith(root, data, oracleData);
    root.querySelector('.faith-membership-member')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'center' });
  });

  root.querySelector('#faithLeave')?.addEventListener('click', () => {
    writeMember(null);
    renderFaith(root, data, oracleData);
    root.querySelector('.faith-membership-visitor')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'center' });
  });

  root.querySelector('#faithOracleDraw')?.addEventListener('click', () => {
    drawOracle(oracleData.entries);
    renderFaith(root, data, oracleData);
    root.querySelector('#faithOracle')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'center' });
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
    const [faithResponse, oracleResponse] = await Promise.all([fetch(DATA_URL), fetch(ORACLE_URL)]);
    if (!faithResponse.ok) throw new Error(`Faith data request failed: ${faithResponse.status}`);
    if (!oracleResponse.ok) throw new Error(`Oracle data request failed: ${oracleResponse.status}`);
    renderFaith(root, await faithResponse.json(), await oracleResponse.json());
  } catch (error) {
    console.error(error);
    root.innerHTML = '<p class="faith-error">圣卷暂时无法展开，请稍后再试。</p>';
  }
}
