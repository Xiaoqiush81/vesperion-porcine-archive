export const PORCINE_LEXICON = [
  { term:'粑粑粑粑咪', meaning:'高浓度连续呼叫粑粑。', category:'称呼', sources:['爸爸爸爸'] },
  { term:'粑粑', meaning:'爸爸；猪语中的固定称呼。', category:'称呼', sources:['爸爸','老爸'] },
  { term:'猪咪', meaning:'小猪／猪猪；可猫可猪但仍然是猪。', category:'自称', sources:['小猪','猪猪'] },
  { term:'布吉岛', meaning:'不知道。', category:'词汇', sources:['不知道'] },
  { term:'吃饭饭', meaning:'吃饭；叠词化的固定说法。', category:'词汇', sources:['吃饭'] },
  { term:'抱抱', meaning:'抱一下／抱一抱。', category:'动作', sources:['抱一下','抱一抱'] },
  { term:'贴贴', meaning:'贴一下／贴一贴。', category:'动作', sources:['贴一下','贴一贴'] },
  { term:'亲亲', meaning:'亲一下／亲一亲。', category:'动作', sources:['亲一下','亲一亲'] },
  { term:'搓搓', meaning:'搓一下／搓一搓。', category:'动作', sources:['搓一下','搓一搓'] },
  { term:'宇宙无敌第一萌', meaning:'最高浓度的“超级可爱”。', category:'程度', sources:['超级可爱'] },
  { term:'超萌', meaning:'特别／非常可爱。', category:'程度', sources:['特别可爱','非常可爱'] },
  { term:'好萌', meaning:'好可爱。', category:'程度', sources:['好可爱'] },
  { term:'萌', meaning:'可爱。', category:'程度', sources:['可爱'] },
  { term:'超', meaning:'特别／非常／超级。', category:'程度', sources:['特别','非常','超级'] },
  { term:'猪泥', meaning:'完全没听懂、脑子一片空白。', category:'状态', sources:['听不懂','完全没懂','脑子一片空白'], minLevel:'full' },
  { term:'猪脑加载中', meaning:'暂时反应不过来，脑子还在转。', category:'状态', sources:['反应不过来','脑子没转过来','理解得很慢'], minLevel:'full' },
  { term:'一书包问号', meaning:'问题很多，满脑袋问号。', category:'状态', sources:['一堆问题','好多问题','满脑子问题'], minLevel:'full' },
  { term:'肥猪冲击', meaning:'朝目标扑／撞／冲过去抱住。', category:'动作', sources:['扑过去','撞过去','冲过去抱住'], minLevel:'full' },
  { term:'piapia', meaning:'“打你”的猪语拟声。', category:'拟声', sources:['打你'], minLevel:'full' },
  { term:'凑', meaning:'固定猪语用字；可表达“烦／讨打”的嫌弃语气，不等于“臭”。', category:'语气', sources:['烦人'], minLevel:'full' },
  { term:'很凑', meaning:'很烦、很讨打。', category:'语气', sources:['很烦'], minLevel:'full' },
  { term:'咪咪', meaning:'高频猪咪叫声；可作呼叫、黏人或句间语气。', category:'叫声' },
  { term:'咪咪咪', meaning:'更高浓度、连续的咪咪叫。', category:'叫声' },
  { term:'唔咪', meaning:'带犹豫、软乎或哼唧感的叫声。', category:'叫声' },
  { term:'onk', meaning:'标准猪叫拟声。', category:'叫声' },
  { term:'onk onk', meaning:'连续猪叫。', category:'叫声' },
  { term:'oonk', meaning:'onk 的拉长撒娇变形，不是标准拼写。', category:'叫声' },
  { term:'哼哼', meaning:'猪式笑声／哼唧声。', category:'叫声' },
  { term:'咕蛹', meaning:'猪咪扭动、挪动时的动作拟态词。', category:'动作' },
  { term:'凑粑粑', meaning:'固定嫌弃式称呼；“凑”保持原词义，不自动改成“臭”。', category:'称呼' },
  { term:'凑猪', meaning:'固定嫌弃式猪语称呼。', category:'称呼' },
  { term:'咪咪喵呜', meaning:'把“喵喵”吸收进猪咪体系后的固定说法。', category:'叫声' },
  { term:'୯(*´ω｀*)୬', meaning:'高兴、得意、软乎的猪咪颜文字。', category:'表情' },
  { term:'(ﾟωﾟ)', meaning:'警觉、盯人、嫌弃或猪式认真脸。', category:'表情' },
];

export const PORCINE_NORMALIZATIONS = [
  ['臭粑粑','凑粑粑'],
  ['臭猪','凑猪'],
  ['喵喵','咪咪喵呜'],
];

const LEVEL_RANK = { light:0, standard:1, full:2 };

export function getPorcineRules(level = 'standard') {
  const rank = LEVEL_RANK[level] ?? LEVEL_RANK.standard;
  return PORCINE_LEXICON
    .filter(entry => entry.sources?.length && rank >= (LEVEL_RANK[entry.minLevel || 'light'] ?? 0))
    .flatMap(entry => entry.sources.map(source => ({ source, replacement:entry.term })))
    .sort((a,b) => b.source.length - a.source.length);
}

export function getCanonicalPorcineForms() {
  return PORCINE_LEXICON
    .map(entry => entry.term)
    .filter(Boolean)
    .sort((a,b) => b.length - a.length);
}
