export const PIGLIZA_LEADS = {
  neutral:['','咪。','猪莉莎把这句话先放在桌面上。'],
  soft:['','先不急。','咪，猪莉莎听见了。'],
  bright:['','噢哼哼。','这截话让猪莉莎的耳朵竖起来惹。'],
};

export const PIGLIZA_STRATEGIES = [
  { id:'relief-change', negated:true, valence:['negative'], weight:96, stages:['clarify','deepen','contrast','action'], lead:'bright', templates:['听起来“{topic}”已经轻了一点。是什么发生了变化？','小猪是什么时候发现这份{feeling}没有之前那么重了？','这次缓下来，有什么是小猪自己做对了的？'] },
  { id:'uncertainty', acts:['uncertain'], weight:90, stages:['clarify'], lead:'soft', templates:['不知道也可以。现在最接近的感觉是什么？','如果不用说得准确，小猪能先说一点点吗？','是什么让“{topic}”这么难说清？'] },
  { id:'cause-check', acts:['cause','result'], weight:82, stages:['deepen','contrast'], lead:'neutral', templates:['“{topic}”是主要原因，还是其中一个原因？','如果暂时拿走“{topic}”，事情会变得不一样吗？','小猪有多确定关键就在“{topic}”？'] },
  { id:'desire', acts:['desire'], weight:78, stages:['clarify','action'], lead:'neutral', templates:['如果真的得到“{topic}”，对小猪来说会改变什么？','是什么挡在小猪和“{topic}”之间？','小猪期待“{topic}”带来什么感觉？'] },
  { id:'inability', acts:['inability'], weight:78, stages:['contrast','action'], lead:'soft', templates:['是什么让小猪认定自己做不到“{topic}”？','以前有没有哪一次，小猪比预想中更接近“{topic}”？','如果不要求立刻做到，最小的一步会是什么？'] },
  { id:'belief-evidence', acts:['belief'], weight:70, stages:['deepen','contrast'], lead:'neutral', templates:['是什么让小猪这样看待“{topic}”？','这种判断一直都在，还是今天尤其明显？','哪些事实支持它，哪些部分更像担心？'] },
  { id:'generalization', acts:['generalize'], weight:72, stages:['contrast'], lead:'neutral', templates:['真的每一次都和“{topic}”有关吗？','有没有哪一次稍微不一样？','小猪最早什么时候开始把它看成没有例外的事？'] },
  { id:'bot-question', acts:['ask-bot'], weight:68, stages:['clarify'], lead:'neutral', templates:['小猪为什么会想知道猪莉莎关于“{topic}”的答案？','如果猪莉莎回答了，它会替小猪解决什么？','比起猪莉莎怎么想，小猪自己的答案是什么？'] },
  { id:'clarify-affect', valence:['negative'], weight:56, stages:['clarify'], lead:'soft', templates:['“{topic}”里面，哪一部分最{metaphor}？','这份{feeling}更靠近一件具体的事，还是许多事情一起挤过来？','如果只圈出最{metaphor}的一小块，会是哪一块？'] },
  { id:'locate-source', valence:['negative'], weight:54, stages:['deepen'], lead:'neutral', templates:['这份{feeling}最早是从“{topic}”的哪一刻冒出来的？','让小猪难受的更像事情本身，还是它可能带来的后果？','当{feeling}变响时，小猪脑袋里通常先出现哪句话？'] },
  { id:'reality-contrast', valence:['negative'], weight:54, stages:['contrast'], lead:'neutral', templates:['在“{topic}”里，已经发生的和担心会发生的分别是什么？','如果把事实与猜测分开，两边各有什么？','小猪最怕的结果，和现在已经确定的部分有多远？'] },
  { id:'small-step', valence:['negative'], weight:54, stages:['action'], lead:'soft', templates:['如果今天只让“{topic}”轻一点点，小猪最想动哪一处？','现在能暂时卸下一件什么？','不要求解决整团事情，下一小步可以是什么？'] },
  { id:'positive-detail', valence:['positive'], weight:62, stages:['clarify','deepen','contrast','action'], lead:'bright', templates:['“{topic}”里面，哪一刻最值得小猪翘尾巴？','小猪最想把这份{feeling}讲给谁听？','这件事说明小猪身上有什么以前容易忽略的东西？'] },
  { id:'relationship', kinds:['relation'], weight:58, stages:['clarify','deepen','contrast'], lead:'soft', templates:['在“{topic}”里，小猪最希望对方理解什么？','对方的反应和小猪原本期待的有什么不同？','这段关系最拉扯小猪的是靠近、躲开，还是没有被听见？'] },
  { id:'context-impact', kinds:['context'], weight:50, stages:['clarify','deepen','contrast'], lead:'neutral', templates:['关于“{topic}”，哪件具体的小事最占脑袋？','“{topic}”现在影响小猪最多的是时间、精力，还是对自己的看法？','如果“{topic}”明天只改善一点，小猪希望是哪一点？'] },
  { id:'topic-open', requiresTopic:true, weight:34, stages:['clarify','deepen'], lead:'neutral', templates:['关于“{topic}”，小猪最想让猪莉莎先接住哪一部分？','“{topic}”对小猪最重要的地方是什么？','这让小猪还联想到什么？'] },
];

function fill(template, slots) { return template.replace(/\{(\w+)\}/gu, (_, key) => slots[key] || '这件事'); }
function choose(items, last, random) { let index = Math.floor(random() * items.length); if (items.length > 1 && index === last) index = (index + 1) % items.length; return { value:items[index], index }; }

export function realizePiglizaPlan({ frame, strategy }, state, random = Math.random) {
  const slots = { topic:frame.topic || frame.primary?.topic || '这件事', feeling:frame.primary?.label || '感觉', metaphor:frame.primary?.metaphor || '占脑袋' };
  const templateKey = `strategy:${strategy.id}`, leadKey = `lead:${strategy.lead}`;
  const template = choose(strategy.templates, state.lastChoices[templateKey], random);
  const leads = PIGLIZA_LEADS[strategy.lead] || PIGLIZA_LEADS.neutral, lead = choose(leads, state.lastChoices[leadKey], random);
  state.lastChoices[templateKey] = template.index; state.lastChoices[leadKey] = lead.index;
  return [lead.value, fill(template.value, slots)].filter(Boolean).join('');
}

export function estimatePiglizaResponseSpace(data) {
  return data.strategies.reduce((total, strategy) => {
    const concepts = data.concepts.filter(concept => (!strategy.kinds || strategy.kinds.includes(concept.kind)) && (!strategy.valence || strategy.valence.includes(concept.valence))).length || 1;
    return total + concepts * strategy.templates.length * (PIGLIZA_LEADS[strategy.lead] || PIGLIZA_LEADS.neutral).length;
  }, 0);
}
