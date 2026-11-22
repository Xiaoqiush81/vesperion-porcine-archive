const ZH = {
  detect:/[\u3400-\u9fff]/u,
  definition:/^(?:(?:我们(?:这边|这里|行业里)|我说的)\s*)?([^，。！？?]{1,36}?)(?:是指|指的是)(.{1,160}?)[。！]?$/u,
  termQuestion:/^(.{1,36}?)(?:是什么意思|指的是什么)[？?。]?$/u,
  negative:/^(?:不是这个意思|你理解错了|别这么问|不要反问|太啰嗦了?|没听懂)[。！!]?$/u,
  positive:/^(?:对|对的|就是|没错|这样就好)[。！!]?$/u,
  modes:[
    ['casual', /^(?:别分析(?:我)?|不要心理分析|随便聊聊|闲聊(?:就好)?)[。！!]?$/u, '好，猪莉莎切到闲聊。你说什么，猪莉莎就接什么。'],
    ['reflective', /^(?:认真分析|帮我理一理|进入分析模式)[。！!]?$/u, '好，猪莉莎会认真拆解接下来的话。'],
    ['adaptive', /^(?:恢复自动判断|自动判断)[。！!]?$/u, '好，猪莉莎恢复自动判断。'],
  ],
  feedback:{ negative:'收到，猪莉莎把刚才那种接法调低了。你可以直接纠正哪里不对。', positive:'好，猪莉莎记住这种接法更合适。' },
  unknownTerm:term => `“${term}”在你这里具体指什么？`,
  knownTerm:(term, meaning) => `按你的用法，“${term}”指的是“${meaning}”。`,
  fallback:{ question:'猪莉莎还不能可靠回答这个问题。最需要解释的是哪一部分？', statement:'猪莉莎听着。然后呢？' },
  operations:[
    { id:'next-topic', patterns:[/^(?:换(?:一个|个)(?:说|聊)?|说(?:另一个|别的)|另一个呢|先不说这个|换个话题|还有别的吗)[。！!?？]?$/u] },
    { id:'choose', patterns:[/(?:帮|替|给)我选|选哪(?:个|一个)|(?:吃|穿|玩|看)(?:什么|啥)|.+(?:还是|或者|或是).+/u] },
  ],
  moves:{
    choice:['猪莉莎拍板：{value}。','不用继续纠结惹，选“{value}”。','终端已经替小猪决定：{value}。'],
    'choice-clarify':['可以。把候选项，或者要选的那类东西告诉猪莉莎。','猪莉莎可以拍板；小猪正在从什么里面选？'],
    'resume-topic':['小猪刚才还提到过“{topic}”。这部分后来怎么样了？','那换到刚才没聊完的“{topic}”。小猪想从哪里说？'],
    'agenda-empty':['猪莉莎这里暂时没有压着没聊的话题。小猪想换去说什么？'],
  },
};

const EN = {
  detect:/[a-z]/iu,
  definition:/^(.{1,36}?) means (.{1,160}?)[.!]?$/iu,
  termQuestion:/^what does (.{1,36}?) mean[?？]?$/iu,
  negative:/^(?:that's not what i meant|you misunderstood|don't ask like that|too verbose)[.!]?$/iu,
  positive:/^(?:yes|exactly|that's right|that works)[.!]?$/iu,
  modes:[
    ['casual', /^(?:just chat|casual mode)[.!]?$/iu, 'Okay. PIGLIZA will keep this conversational.'],
    ['reflective', /^(?:analyze this|reflective mode)[.!]?$/iu, 'Okay. PIGLIZA will examine the next message more closely.'],
    ['adaptive', /^(?:automatic mode|adapt automatically)[.!]?$/iu, 'Okay. PIGLIZA will choose the mode from context.'],
  ],
  feedback:{ negative:'Got it. I lowered that response style; correct the part I missed.', positive:'Got it. I’ll favor that response style.' },
  unknownTerm:term => `What does “${term}” mean in your context?`,
  knownTerm:(term, meaning) => `In your usage, “${term}” means “${meaning}”.`,
  fallback:{ question:'I may not understand that question reliably yet. Which part should we clarify first?', statement:'I’m listening. What happened next?', brief:'Got it. What happened next?' },
  operations:[
    { id:'next-topic', patterns:[/^(?:let'?s (?:talk about|discuss) something else|another topic|switch topics?|what else)[.!?]?$/iu] },
    { id:'choose', patterns:[/choose(?: one)? for me|what should i (?:eat|wear|play|watch)|which (?:one )?should i choose|.+\s+(?:or|versus|vs\.?)\s+.+/iu] },
  ],
  moves:{
    choice:['PIGLIZA chooses: {value}.','Decision printed: {value}.'],
    'choice-clarify':['Give PIGLIZA the options or the kind of thing you want chosen.'],
    'resume-topic':['You also mentioned “{topic}” earlier. Where should we pick that up?'],
    'agenda-empty':['PIGLIZA has no deferred topic yet. What would you like to switch to?'],
  },
};

export const PIGLIZA_LOCALES = Object.freeze({ zh:ZH, en:EN });

export function detectPiglizaLocale(text) {
  if (ZH.detect.test(text)) return 'zh';
  if (EN.detect.test(text)) return 'en';
  return 'unknown';
}
