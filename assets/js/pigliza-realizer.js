export const PIGLIZA_LEADS = {
  neutral:['','咪。','猪莉莎把这句话先放在桌面上。'],
  soft:['','先不急。','咪，猪莉莎听见了。'],
  bright:['','噢哼哼。','这截话让猪莉莎的耳朵竖起来惹。'],
};

const META_EXPLANATIONS = {
  'clarify-affect':'猪莉莎是在问，那团感觉里最明显的是哪一小块。',
  'locate-source':'猪莉莎是在问，这种感觉最早从哪里冒出来。',
  'reality-contrast':'猪莉莎是在请小猪分开已经发生的事和担心会发生的事。',
  'small-step':'猪莉莎不是催小猪解决全部，只是在问最小的一步。',
  'uncertainty':'猪莉莎是在说，不知道也可以，先说最接近的感觉就行。',
  'cause-check':'猪莉莎是在确认，小猪说的是主要原因还是其中一个原因。',
  'desire':'猪莉莎是在问，小猪真正想得到的变化是什么。',
  'inability':'猪莉莎是在问，是什么让小猪认定这件事做不到。',
  'belief-evidence':'猪莉莎是在问，这个判断是从哪些事情里来的。',
  'context-impact':'猪莉莎是在问，这件日常事情具体影响了哪里。',
  'relationship':'猪莉莎是在问，这段关系里小猪最在意什么。',
  'positive-detail':'猪莉莎是在请小猪把开心的那一刻再讲清一点。',
  'food-chat':'猪莉莎刚才只是在认真讨论吃什么，没有偷偷做心理分析。',
  'social-follow':'猪莉莎刚才是在顺着小猪的日常消息问后续。',
  fallback:'猪莉莎刚才没完全听懂，只是在请小猪多说一点。',
};

const META_REASONS = {
  'clarify-affect':'猪莉莎想知道小猪说的是哪一部分，而不是把整团话都算成一种感觉。',
  'reality-contrast':'猪莉莎想把已经发生的和脑袋里预演的分开。',
  'small-step':'一下解决全部通常太大了，猪莉莎才把问题缩小。',
  'food-chat':'小猪提到了吃的，猪莉莎当然顺着饭饭往下聊。',
};

export const PIGLIZA_STRATEGIES = [
  { id:'meta-clarify', meta:true, acts:['clarify-request'], weight:150, stages:['clarify','deepen','contrast','action'], lead:'neutral', templates:['{explanation}','换成直白话就是：{explanation}','猪莉莎刚才说绕了。{explanation}'] },
  { id:'meta-why', meta:true, acts:['why-followup'], weight:148, stages:['clarify','deepen','contrast','action'], lead:'neutral', templates:['因为{reason}','猪莉莎这样问，是因为{reason}','没有神秘目的：{reason}'] },
  { id:'meta-continue', meta:true, acts:['continue-chat'], weight:146, stages:['clarify','deepen','contrast','action'], lead:'neutral', templates:['可以。接着说说“{topic}”后来怎么样了。','然后猪莉莎继续听。关于“{topic}”，后面还发生了什么？','还有的话就继续倒出来，猪莉莎接着。'] },
  { id:'social-greeting', acts:['greeting'], weight:130, stages:['clarify','deepen','contrast','action'], lead:'bright', templates:['在。猪莉莎的电子猪耳朵已经竖起来惹。','咪，小猪来啦。今天想闲聊还是认真聊？','猪莉莎在线。先投递一条什么消息？'] },
  { id:'social-thanks', acts:['thanks'], weight:130, stages:['clarify','deepen','contrast','action'], lead:'bright', templates:['不客气，收下一枚电子猪蹄印。','咪，小事一桩。','收到小猪的谢谢惹，猪莉莎尾巴翘一下。'] },
  { id:'social-laughter', acts:['laughter'], weight:128, stages:['clarify','deepen','contrast','action'], lead:'bright', templates:['笑成这样，看来这条消息很有猪事。','哈哈哈哈，猪莉莎也跟着抖两下。','不许独笑，发生什么好笑的惹？'] },
  { id:'social-insult', acts:['insult'], weight:128, stages:['clarify','deepen','contrast','action'], lead:'bright', templates:['承认，猪莉莎偶尔是一台笨蛋电子猪。','检测到辱猪事件——但这次好像骂得有道理。','咪！猪莉莎先记仇两秒，然后继续听。'] },
  { id:'social-ack', acts:['acknowledge'], weight:124, stages:['clarify','deepen','contrast','action'], lead:'neutral', templates:['好，这一点先记下。','嗯哼，猪莉莎收到。','可以，继续往下说。'] },
  { id:'social-disagree', acts:['disagree'], weight:124, stages:['clarify','deepen','contrast','action'], lead:'neutral', templates:['好，那猪莉莎刚才理解错了。小猪纠正哪一部分？','收到，不是那样。正确版本是什么？','撤回刚才的猜法，小猪重新说。'] },
  { id:'food-chat', acts:['food-talk'], weight:122, stages:['clarify','deepen','contrast','action'], lead:'bright', templates:['吃。小猪现在最想点什么？','外卖提案通过。先选咸的、甜的，还是喝的？','猪莉莎投赞成票：饭饭问题应该立即处理。'] },
  { id:'social-bored', acts:['bored'], weight:120, stages:['clarify','deepen','contrast','action'], lead:'bright', templates:['无聊猪已被猪莉莎捕获。要闲聊、玩问答，还是随便胡说？','那就投递一件今天最荒谬的小事。','猪莉莎批准小猪在这里说一点毫无用处的废话。'] },
  { id:'social-smalltalk', acts:['small-talk'], weight:118, stages:['clarify','deepen','contrast','action'], lead:'bright', templates:['猪莉莎正在会客室里假装很忙，实际上就在等小猪说话。','一台电子猪能干嘛——听小猪讲话，偶尔说点猪话。','现在？正在运行，并努力不当笨蛋。'] },
  { id:'social-follow', acts:['statement'], weight:42, stages:['clarify','deepen','contrast','action'], lead:'neutral', templates:['噢？“{topic}”后面还有吗？','这条日常播报猪莉莎收到了。然后发生了什么？','好，猪莉莎跟上了。继续继续。'] },
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
  const previous = state.lastStrategy || 'fallback';
  const slots = {
    topic:frame.topic || state.activeFrame?.topic || frame.primary?.topic || '这件事',
    feeling:frame.primary?.label || '感觉', metaphor:frame.primary?.metaphor || '占脑袋',
    explanation:META_EXPLANATIONS[previous] || '猪莉莎刚才是在请小猪把那句话多说一点。',
    reason:META_REASONS[previous] || '猪莉莎想确认自己有没有听对。',
  };
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
