import { PROFILES } from './identity-data.js?v=20261031-specimens-59';

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
  if (!answers.length || !specimens.length) return undefined;
  const byId=new Map(specimens.map(item=>[item.id,item]));
  const traits=answers.flat().reduce((all,trait)=>({...all,[trait]:(all[trait]||0)+1}),{});
  const traitNorm=Math.hypot(...Object.values(traits));
  const ranked=PROFILES.map(([id,weights],order)=>{
    const weightNorm=Math.hypot(...Object.values(weights));
    const overlap=Object.entries(weights).reduce((sum,[trait,weight])=>sum+(traits[trait]||0)*weight,0);
    return {specimen:byId.get(id),order,score:overlap/(traitNorm*weightNorm||1)};
  })
    .filter(item=>item.specimen).sort((a,b)=>b.score-a.score||a.order-b.order);
  if (!ranked.length || !traitNorm) return undefined;
  const finalists=ranked.filter(item=>ranked[0].score-item.score<=.075);
  const signature=Object.entries(traits).sort(([a],[b])=>a.localeCompare(b)).map(([trait,count])=>`${trait}:${count}`).join('|');
  const hash=[...signature].reduce((value,char)=>Math.imul(value^char.charCodeAt(0),16777619)>>>0,2166136261);
  return finalists[hash%finalists.length]?.specimen;
}

// Resolve IDs against the current bank, so retired questions cannot break a saved session.
export function restoreIdentitySession(session, bank) {
  if (!session || session.version !== 1 || !Array.isArray(session.questionIds) || !Array.isArray(session.choices)) return null;
  const dimensions = new Set(bank.map(question => question.dimension));
  const byId = new Map(bank.map(question => [question.id, question]));
  const questions = session.questionIds.map(id => byId.get(id));
  if (questions.length !== dimensions.size || questions.some(question => !question)
    || new Set(questions.map(question => question.dimension)).size !== dimensions.size
    || session.choices.length !== questions.length || !Number.isInteger(session.step)
    || session.step < 0 || session.step >= questions.length) return null;
  if (session.choices.some((choice, index) => choice !== null && (!Number.isInteger(choice)
    || choice < 0 || choice >= questions[index].options.length))) return null;
  if (session.choices.slice(0, session.step).some(choice => choice === null)) return null;
  return { questions, choices:[...session.choices], step:session.step };
}
