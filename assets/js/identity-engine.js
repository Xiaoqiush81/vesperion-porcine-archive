import { PROFILES } from './identity-data.js?v=20261025-expanded-1';

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
  return PROFILES.map(([id,weights],order)=>({specimen:byId.get(id),order,score:Object.entries(weights).reduce((sum,[trait,weight])=>sum+(traits[trait]||0)*weight,0)}))
    .filter(item=>item.specimen).sort((a,b)=>b.score-a.score||a.order-b.order)[0]?.specimen;
}
