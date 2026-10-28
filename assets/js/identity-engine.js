import { PROFILES } from './identity-data.js?v=20261028-kewty-1';

const randomIndex = max => {
  if (globalThis.crypto?.getRandomValues) { const value = new Uint32Array(1); globalThis.crypto.getRandomValues(value); return value[0] % max; }
  return Math.floor(Math.random() * max);
};

export function drawQuestionSet(bank, previousIds = []) {
  const previous = new Set(previousIds), groups = new Map();
  bank.forEach(question => groups.set(question.dimension,[...(groups.get(question.dimension)||[]),question]));
  const selected = [...groups.values()].map(group => {
    const fresh = group.filter(question => !previous.has(question.id));
    const pool = fresh.length ? fresh : group;
    return pool[randomIndex(pool.length)];
  });
  for (let i=selected.length-1;i>0;i-=1) { const j=randomIndex(i+1); [selected[i],selected[j]]=[selected[j],selected[i]]; }
  return selected;
}

export function matchSpecimen(answers, specimens) {
  const byId=new Map(specimens.map(item=>[item.id,item]));
  const traits=answers.flat().reduce((all,trait)=>({...all,[trait]:(all[trait]||0)+1}),{});
  const traitNorm=Math.hypot(...Object.values(traits));
  const ranked=PROFILES.map(([id,weights],order)=>{
    const weightNorm=Math.hypot(...Object.values(weights));
    const overlap=Object.entries(weights).reduce((sum,[trait,weight])=>sum+(traits[trait]||0)*weight,0);
    return {specimen:byId.get(id),order,score:overlap/(traitNorm*weightNorm||1)};
  })
    .filter(item=>item.specimen).sort((a,b)=>b.score-a.score||a.order-b.order);
  const finalists=ranked.filter(item=>ranked[0].score-item.score<=.075);
  const signature=Object.entries(traits).sort(([a],[b])=>a.localeCompare(b)).map(([trait,count])=>`${trait}:${count}`).join('|');
  const hash=[...signature].reduce((value,char)=>Math.imul(value^char.charCodeAt(0),16777619)>>>0,2166136261);
  return finalists[hash%finalists.length]?.specimen;
}
