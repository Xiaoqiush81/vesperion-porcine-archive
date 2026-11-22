// Portable schema only: no DOM, downloads, or storage writes.
export const ARCHIVE_FORMAT = 'vesperion-porcine-archive';
export const ARCHIVE_VERSION = 3;
export const MAX_ARCHIVE_BYTES = 1024 * 1024;
export const ARCHIVE_KEYS = Object.freeze({
  favorites:'pigdex-favorites-v1', identityHistory:'vesperion-identity-history',
  identityQuestions:'vesperion-identity-last-questions', identitySession:'vesperion-identity-session-v1',
  tarotHistory:'vesperion-tarot-history', scholiaAnswers:'vesperion-scholia-answers-v1',
  extracurricularAnswers:'vesperion-extracurricular-answers-v1',
  faithMember:'pigdex-faith-member-v1', faithOracle:'pigdex-faith-oracle-v1',
  pigliza:'pigdex-pigliza-v1',
  theme:'pigdex-theme', baseTheme:'pigdex-base-theme', audio:'pigdex-audio-v1'
});
const owns = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const fail = path => { throw new Error(`档案中的「${path}」格式无效，未修改当前记录。`); };
const object = (value, path) => value && typeof value === 'object' && !Array.isArray(value) ? value : fail(path);
const string = (value, limit, path, required = false) => typeof value === 'string' && value.length <= limit && (!required || value.length) ? value : fail(path);
const list = (value, limit, path) => Array.isArray(value) && value.length <= limit ? value : fail(path);
const strings = (value, limit, path) => [...new Set(list(value, limit, path).map(item => string(item, 160, path, true)))];
const date = (value, path) => typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value)) ? value : fail(path);
const flag = (value, path) => typeof value === 'boolean' ? value : fail(path);
const day = (value, path) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value))
    || new Date(value).toISOString().slice(0, 10) !== value) fail(path);
  return value;
};

function session(value) {
  if (value === null) return null;
  object(value, '鉴定进度');
  const questionIds = strings(value.questionIds, 20, '鉴定题目');
  const choices = list(value.choices, 20, '鉴定选择');
  if (value.version !== 1 || !questionIds.length || questionIds.length !== value.questionIds.length
    || choices.length !== questionIds.length || !Number.isInteger(value.step) || value.step < 0 || value.step >= questionIds.length
    || choices.some(choice => choice !== null && (!Number.isInteger(choice) || choice < 0 || choice > 20))
    || choices.slice(0, value.step).some(choice => choice === null)) fail('鉴定进度');
  return { version:1, questionIds, choices:[...choices], step:value.step, updatedAt:date(value.updatedAt, '鉴定保存日期') };
}

function audioSettings(value) {
  object(value, '声景偏好');
  const volume = (key, fallback) => {
    if (!owns(value, key)) return fallback;
    return typeof value[key] === 'number' && Number.isFinite(value[key]) && value[key] >= 0 && value[key] <= 1 ? value[key] : fail('声景音量');
  };
  return { music:owns(value,'music') ? flag(value.music,'背景音乐') : false,
    effects:owns(value,'effects') ? flag(value.effects,'音效') : false,
    musicVolume:volume('musicVolume',.65), effectsVolume:volume('effectsVolume',.5) };
}

function oracleRecord(value) {
  object(value, '猪谕记录');
  return { date:day(value.date, '猪谕日期'), id:string(value.id, 80, '猪谕编号', true) };
}

function piglizaSession(value) {
  object(value, '猪莉莎谈话');
  if (value.version !== 1) fail('猪莉莎谈话版本');
  const messages = list(value.messages, 40, '猪莉莎消息').map(item => {
    object(item, '猪莉莎消息');
    if (!['user','bot'].includes(item.role)) fail('猪莉莎消息角色');
    return { role:item.role, content:string(item.content,1200,'猪莉莎消息内容',true) };
  });
  const engine = object(value.engine, '猪莉莎状态');
  const memory = list(engine.memory ?? [], 12, '猪莉莎记忆').map(item => string(item,1200,'猪莉莎记忆'));
  const choices = object(engine.lastChoices ?? {}, '猪莉莎选择记录');
  if (Object.keys(choices).length > 100 || Object.values(choices).some(choice => !Number.isInteger(choice) || choice < -1 || choice > 100)) fail('猪莉莎选择记录');
  const lastGroup = engine.lastGroup == null ? null : string(engine.lastGroup,80,'猪莉莎上次话题',true);
  const lastStrategy = engine.lastStrategy == null ? null : string(engine.lastStrategy,80,'猪莉莎上次策略',true);
  const turn = engine.turn == null ? 0 : engine.turn;
  if (!Number.isInteger(turn) || turn < 0 || turn > 100000) fail('猪莉莎谈话轮次');
  return { version:1, messages, engine:{ memory, lastChoices:{ ...choices }, lastGroup, lastStrategy, turn, quit:flag(engine.quit ?? false,'猪莉莎结束状态') } };
}

export function normalizeArchive(archive) {
  object(archive, '文件');
  if (archive.format !== ARCHIVE_FORMAT || ![1,2,ARCHIVE_VERSION].includes(archive.version)) throw new Error('这不是支持的宅邸档案版本。');
  const data = object(archive.data, '档案内容');
  const sections = ['favorites','identity','tarot','scholia','preferences','faith'];
  if (!sections.some(key => owns(data, key))) fail('档案内容');
  if (archive.version >= 2 && sections.some(key => !owns(data, key))) fail('完整档案');
  if (archive.version >= 3 && !owns(data,'pigliza')) fail('猪莉莎谈话');
  const entries = new Map(), summary = [];
  const put = (key, value) => entries.set(ARCHIVE_KEYS[key], value === null ? null : JSON.stringify(value));

  if (owns(data,'favorites')) {
    const value = object(data.favorites, '收藏');
    const specimens = strings(value.specimens, 500, '猪种收藏'), tarot = strings(value.tarot, 500, '塔罗收藏');
    put('favorites', { specimens, tarot }); summary.push(`收藏 ${specimens.length + tarot.length} 项`);
  }
  if (owns(data,'identity')) {
    const value = object(data.identity, '鉴定');
    const history = list(value.history, 8, '鉴定记录').map(item => {
      object(item, '鉴定记录');
      return { id:string(item.id,80,'猪种编号',true), name:string(item.name,80,'猪种名称',true), rarity:string(item.rarity,40,'稀有度'), at:date(item.at,'鉴定日期') };
    });
    put('identityHistory', history);
    put('identityQuestions', strings(value.lastQuestions, 100, '上次题组'));
    if (owns(value,'session')) put('identitySession', session(value.session));
    else if (archive.version === 2) fail('鉴定进度');
    summary.push(`鉴定 ${history.length} 次${value.session ? '（含答题进度）' : ''}`);
  }
  if (owns(data,'tarot')) {
    const value = object(data.tarot, '占卜');
    const history = list(value.history, 20, '占卜记录').map(item => {
      object(item, '占卜记录');
      const cards = list(item.cards, 14, '占卜牌组').map(card => {
        object(card, '塔罗牌');
        return { name:string(card.name,80,'牌名'), title:string(card.title,80,'牌名'), reversed:flag(card.reversed,'正逆位'), position:string(card.position,80,'牌位') };
      });
      return { createdAt:date(item.createdAt,'占卜日期'), question:string(item.question,80,'占卜问题'), spreadId:string(item.spreadId ?? item.spread ?? '',80,'牌阵'), cards, note:string(item.note ?? '',500,'占卜笔记') };
    });
    put('tarotHistory', history); summary.push(`占卜 ${history.length} 次`);
  }
  if (owns(data,'scholia')) {
    const value = object(data.scholia, '学习作答'), answers = object(value.answers,'诸科作答');
    if (Object.keys(answers).length > 1000) fail('诸科作答数量');
    put('scholiaAnswers', Object.fromEntries(Object.entries(answers).map(([key, answer]) => [string(key,100,'题目编号',true), string(answer,3000,'作答内容')])));
    let extraCount = 0;
    if (owns(value,'extracurricularAnswers')) {
      const extra = object(value.extracurricularAnswers, '课外综合作答');
      if (Object.keys(extra).length > 1000) fail('课外综合作答数量');
      put('extracurricularAnswers', Object.fromEntries(Object.entries(extra).map(([key, answer]) => [string(key,100,'题目编号',true), string(answer,3000,'作答内容')])));
      extraCount = Object.keys(extra).length;
    }
    summary.push(`诸科作答 ${Object.keys(answers).length} 项${extraCount ? `、课外综合 ${extraCount} 项` : ''}`);
  }
  if (owns(data,'preferences')) {
    const value = object(data.preferences, '界面偏好');
    if (!['paper','night','signal'].includes(value.theme)) fail('主题');
    entries.set(ARCHIVE_KEYS.theme, value.theme);
    put('audio', audioSettings(value.audio));
    if (owns(value,'baseTheme')) {
      if (!['paper','night'].includes(value.baseTheme)) fail('基础主题');
      entries.set(ARCHIVE_KEYS.baseTheme, value.baseTheme);
    } else if (archive.version === 2) fail('基础主题');
    summary.push('主题与声景偏好');
  }
  if (owns(data,'faith')) {
    const value = object(data.faith, '教籍与猪谕');
    if (value.member === null) put('faithMember', null);
    else {
      const member = object(value.member, '教籍');
      put('faithMember', { active:flag(member.active,'教籍状态'), joinedAt:date(member.joinedAt,'入教日期'), mark:string(member.mark,80,'教籍编号') });
    }
    const oracle = object(value.oracle, '猪谕簿');
    const history = list(oracle.history,60,'猪谕历史').map(oracleRecord);
    put('faithOracle', { used:strings(oracle.used,500,'已抽猪谕'), history, today:oracle.today === null ? null : oracleRecord(oracle.today) });
    summary.push(`教籍与猪谕 ${history.length} 签`);
  }
  if (owns(data,'pigliza')) {
    const value = data.pigliza === null ? null : piglizaSession(data.pigliza);
    put('pigliza', value);
    summary.push(`猪莉莎谈话 ${value?.messages.length || 0} 条`);
  }
  return { entries, summary, version:archive.version };
}
