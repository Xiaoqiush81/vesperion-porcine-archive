import { escapeHtml as escape } from './specimen-art.js?v=20261015-specimens-51';
import { TAROT_CARDS } from './tarot-data.js?v=20261019-modular-1';
import { loadReadingHistory } from './tarot-storage.js?v=20261019-modular-1';
import { loadIdentityHistory } from './identity-storage.js?v=20261020-bank-1';
import { SYMBOLIC_LINKS } from './record-links.js?v=20261021-1';

const specimenArt = item => item.artwork || `assets/cards/${item.id.toLowerCase()}.webp`;
const tarotArt = card => `assets/tarot/${String(card.artwork).split('?')[0]}`;
const formatDate = value => new Intl.DateTimeFormat('zh-CN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));

function activityItems(identities, readings) {
  return [
    ...identities.map(item => ({ at:item.at, type:'IDENTIFICATION', title:`鉴定为 ${item.name}`, detail:`${item.rarity} · ${item.id}` })),
    ...readings.map(item => ({ at:item.createdAt, type:'TAROT READING', title:item.question || '一次未命名的占卜', detail:item.cards.map(card => `${card.name}${card.reversed?'（逆）':''}`).join(' · ') }))
  ].filter(item => item.at).sort((a,b) => new Date(b.at)-new Date(a.at)).slice(0,12);
}

function recurringCards(readings) {
  const counts = new Map();
  readings.flatMap(reading => reading.cards || []).forEach(card => {
    const key = card.title || card.name;
    const current = counts.get(key) || { title:card.title, name:card.name, count:0, reversed:0 };
    current.count += 1; if (card.reversed) current.reversed += 1; counts.set(key,current);
  });
  return [...counts.values()].sort((a,b) => b.count-a.count || a.name.localeCompare(b.name)).slice(0,5);
}

export function createRecordRoom(specimens) {
  const identities = loadIdentityHistory(), readings = loadReadingHistory();
  const activities = activityItems(identities, readings), recurring = recurringCards(readings);
  const distinctCards = new Set(readings.flatMap(reading => reading.cards || []).map(card => card.title || card.name)).size;
  document.querySelector('#recordSummary').innerHTML = [
    [specimens.length,'馆藏猪种'],[identities.length,'近期鉴定'],[readings.length,'占卜记录'],[distinctCards,'曾来访牌']
  ].map(([value,label]) => `<div><strong>${value}</strong><span>${label}</span></div>`).join('');
  document.querySelector('#activityLedger').innerHTML = activities.length ? activities.map(item => `<article><time>${escape(formatDate(item.at))}</time><div><small>${item.type}</small><b>${escape(item.title)}</b><p>${escape(item.detail)}</p></div></article>`).join('') : '<p class="record-empty">档案纸还是空白的。完成一次鉴定或保存一场占卜后，记录会自动汇入这里。</p>';
  document.querySelector('#recurringCards').innerHTML = recurring.length ? recurring.map(item => `<article><span>${item.count}</span><div><small>APPEARANCES</small><b>${escape(item.name || item.title)}</b><p>${item.reversed ? `${item.reversed} 次逆位` : '尚未逆位出现'}</p></div></article>`).join('') : '<p class="record-empty">还没有反复出现的牌。保存几场占卜后，档案员会开始统计。</p>';

  const pigById = new Map(specimens.map(item => [item.id,item]));
  const cardById = new Map(TAROT_CARDS.map(card => [card.id,card]));
  document.querySelector('#symbolicLinkGrid').innerHTML = SYMBOLIC_LINKS.map(link => {
    const pig=pigById.get(link.specimen), card=cardById.get(link.tarot); if(!pig||!card)return'';
    return `<article class="symbolic-pair"><div class="pair-images"><img src="${specimenArt(pig)}" alt="${escape(pig.name)}" width="160" height="240" loading="lazy"><span>×</span><img src="${tarotArt(card)}" alt="${escape(card.name)}" width="160" height="240" loading="lazy"></div><small>${escape(pig.id)} · ${escape(card.title)}</small><h4>${escape(pig.name)} × ${escape(card.name)}</h4><p>${escape(link.note)}</p></article>`;
  }).join('');
}
