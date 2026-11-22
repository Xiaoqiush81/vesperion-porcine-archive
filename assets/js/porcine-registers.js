export const PORCINE_REGISTERS = [
  {
    id:'natural',
    label:'日常猪咪',
    description:'原本的自然猪语，不额外改变说话场景。',
  },
  {
    id:'clingy',
    label:'撒娇猪咪',
    description:'更黏人、更软乎，适合呼叫粑粑和贴贴。',
  },
  {
    id:'grumpy',
    label:'炸毛凑猪',
    description:'带一点嫌弃和叉腰感，但不改原意。',
  },
  {
    id:'formal',
    label:'正式猪务',
    description:'收起乱叫，用宅邸公文式猪语表达。',
  },
  {
    id:'piglink',
    label:'PigLink 工程猪',
    description:'短、稳、信息优先，适合班牌通讯。',
  },
];

const REGISTER_IDS = new Set(PORCINE_REGISTERS.map(register => register.id));

export function getPorcineRegister(id = 'natural') {
  return REGISTER_IDS.has(id) ? id : 'natural';
}

export function applyPorcineRegister(text, register, level, seed) {
  const safeRegister = getPorcineRegister(register);
  if (safeRegister === 'natural') return text;

  if (safeRegister === 'formal') {
    return text
      .replace(/我/g, '本猪')
      .replace(/(^|[，。！？!?、；：\s])猪(?=的|要|想|觉得|认为|是|有|会|能|可以|今天|刚|又|还|真|也|都|就|不|没|$)/g, '$1本猪')
      .replace(/叭(?=[。！？!?…]|$)/g, '为宜');
  }

  if (safeRegister === 'piglink') {
    return text
      .replace(/[～~]+/g, '')
      .replace(/([！？!?])\1+/g, '$1')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  if (safeRegister === 'clingy' && level !== 'light') {
    return text
      .replace(/(^|[，。！？!?、；：\s])猪(?=的|要|想|觉得|认为|是|有|会|能|可以|今天|刚|又|还|真|也|都|就|不|没|$)/g, '$1猪咪')
      .replace(/([。！？!?])(?=\s|$)/g, seed % 2 ? '$1咪' : '$1唔咪');
  }

  if (safeRegister === 'grumpy' && level !== 'light') {
    return text
      .replace(/好(?=烦|气|讨厌)/g, '超')
      .replace(/([。！？!?])(?=\s|$)/g, seed % 2 ? '$1哼' : '$1(ﾟωﾟ)');
  }

  return text;
}

export function getRegisterRhythm(register) {
  const safeRegister = getPorcineRegister(register);
  if (safeRegister === 'clingy') {
    return {
      prefix:['粑粑—— ','咪咪—— ','唔咪唔咪—— '],
      suffix:[' ୯(*´ω｀*)୬',' 咪咪',''],
      interjection:['咪咪','唔咪','咕蛹咕蛹'],
    };
  }
  if (safeRegister === 'grumpy') {
    return {
      prefix:['凑粑粑，','哼，',''],
      suffix:[' (ﾟωﾟ)','，凑猪！',''],
      interjection:['哼','凑','onk'],
    };
  }
  if (safeRegister === 'formal') {
    return { prefix:['猪务报告：',''], suffix:['','。'], interjection:[] };
  }
  if (safeRegister === 'piglink') {
    return { prefix:['[猪讯] ',''], suffix:['',''], interjection:[] };
  }
  return null;
}
