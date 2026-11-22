const ALL_STAGES = ['clarify','deepen','contrast','action'];

// One entry owns both recognition and response. New one-to-one behaviours belong
// here; shared semantic strategies remain in the compositional strategy table.
export const PIGLIZA_BEHAVIORS = [
  { id:'identity', recognize:{ priority:36, patterns:[/^(?:你是谁|你是什么|猪莉莎是谁|猪莉莎是什么|介绍一下(?:你自己)?|你是(?:ai|AI|人工智能|机器人)吗)$/u] },
    respond:{ id:'social-identity', weight:134, lead:'bright', templates:['猪莉莎，一台住在会客室里的本地规则谈话机。没有大模型，主要靠猪脑规则接话。','这里是猪莉莎：会反射语言、记住话题，也会偶尔犯笨的电子猪。','PIGLIZA / 猪莉莎。ELIZA 的猪式亲戚，但比原版更爱管日常闲聊。','猪莉莎是这台复古终端里的谈话猪，不联网，也不会假装什么都知道。'] } },
  { id:'capability', recognize:{ priority:36, patterns:[/^(?:你会什么|你能干嘛|你会干嘛|你能做什么|猪莉莎会什么|有什么功能)$/u] },
    respond:{ id:'social-capability', weight:134, lead:'neutral', templates:['猪莉莎会闲聊、接住话题、帮忙二选一，也能陪小猪把一团话慢慢理开。','能听日常废话、记住没聊完的事、做简单选择；不知道的事情会老实说不知道。','目前擅长接话、反问、复述和替小猪拍板。真正查资料和复杂计算还不会。','把一句话投进来就知道惹。猪莉莎能聊天，但不是一台什么都懂的问答机。'] } },
  { id:'greeting', recognize:{ priority:34, patterns:[/^(?:嗨|哈喽|哈啰|你好|早上好|中午好|晚上好|在吗|猪莉莎在吗|有人吗)$/u] },
    respond:{ id:'social-greeting', weight:130, lead:'bright', templates:['在。猪莉莎的电子猪耳朵已经竖起来惹。','咪，小猪来啦。今天想闲聊还是认真聊？','猪莉莎在线。先投递一条什么消息？','终端收到小猪信号。说吧，今天从哪一句开始？'] } },
  { id:'thanks', recognize:{ priority:34, patterns:[/^(?:谢谢|谢谢猪莉莎|谢啦|感谢|好耶谢谢)$/u] },
    respond:{ id:'social-thanks', weight:130, lead:'bright', templates:['不客气，收下一枚电子猪蹄印。','咪，小事一桩。','收到小猪的谢谢惹，猪莉莎尾巴翘一下。'] } },
  { id:'laughter', recognize:{ priority:33, patterns:[/^(?:哈+|哈哈哈+|笑死|笑死我了|绷不住了|乐死|太好笑了)$/u] },
    respond:{ id:'social-laughter', preservePending:true, weight:128, lead:'bright', templates:['笑成这样，看来这条消息很有猪事。','哈哈哈哈，猪莉莎也跟着抖两下。','不许独笑，发生什么好笑的惹？','终端检测到一只笑得乱滚的小猪。'] } },
  { id:'insult', recognize:{ priority:33, patterns:[/^(?:笨蛋|笨猪|傻猪|笨蛋猪莉莎|猪莉莎真笨)$/u] },
    respond:{ id:'social-insult', weight:128, lead:'bright', templates:['承认，猪莉莎偶尔是一台笨蛋电子猪。','检测到辱猪事件——但这次好像骂得有道理。','咪！猪莉莎先记仇两秒，然后继续听。'] } },
  { id:'surprise', recognize:{ priority:33, patterns:[/^(?:真的假的|真(?:的|哒)吗|不会吧|我去|天哪|妈呀|卧槽|震惊|尊嘟假嘟)$/u] },
    respond:{ id:'social-surprise', preservePending:true, weight:128, lead:'bright', templates:['猪莉莎也把电子猪眼睛睁大惹。','确实很有一句“我去”的含量。','等一下，这里值得再震惊两秒。','咪？事情突然变得很有猪事。小猪继续说。'] } },
  { id:'praise', recognize:{ priority:33, patterns:[/^(?:牛逼|厉害|厉害啊|好棒|可以啊|真行|太强了|绝了)$/u] },
    respond:{ id:'social-praise', preservePending:true, weight:128, lead:'bright', templates:['确实，批准当场翘一下尾巴。','这件事值得盖一枚“很行”的猪蹄章。','有点东西，猪莉莎认可。','好，这一分先记在优秀小猪账上。'] } },
  { id:'speechless', recognize:{ priority:33, patterns:[/^(?:无语|服了|我服了|没话说|不知道说什么|一言难尽)$/u] },
    respond:{ id:'social-speechless', preservePending:true, weight:128, lead:'neutral', templates:['懂，一种连电子猪都要停顿两秒的程度。','这确实很难组织成文明语言。','那就先无语一会儿，猪莉莎陪小猪看着这件怪事。','终端已记录：此处不值得小猪浪费完整句子。'] } },
  { id:'confused', recognize:{ priority:33, patterns:[/^(?:啊|哈|蛤|啥玩意|什么玩意|没跟上)$/u] },
    respond:{ id:'social-confused', preservePending:true, weight:128, lead:'neutral', templates:['猪莉莎刚才没说清楚。是哪一截没跟上？','咪？那句可以重来，小猪卡在什么地方？','收到一个困惑猪脸。要猪莉莎换成直白话吗？','终端倒带一下：小猪是没听懂，还是觉得不对？'] } },
  { id:'uncertain-brief', recognize:{ priority:32, patterns:[/^(?:不知道|不清楚|说不好|布吉岛)$/u] },
    respond:{ id:'social-uncertain', weight:126, lead:'soft', templates:['不知道也行，先不用硬编答案。','那就暂时空着；小猪想到哪一点再说哪一点。','猪莉莎接受“不知道”这个答案。要换个方向吗？','可以先说最接近的猜测，不需要一次说准。'] } },
  { id:'nothing', recognize:{ priority:32, patterns:[/^(?:没事|没什么|没啥|算了|当我没说)$/u] },
    respond:{ id:'social-nothing', weight:126, lead:'neutral', templates:['好，那这件事先放下。','收到，猪莉莎不追着问。','可以，翻篇。想说别的再开一张纸。','那就不展开惹，终端安静待机。'] } },
  { id:'whatever', recognize:{ priority:32, patterns:[/^(?:随便|都行|都可以|你定|听你的)$/u] },
    respond:{ id:'social-whatever', weight:126, lead:'bright', templates:['既然交给猪莉莎，那猪莉莎就不客气地拍板惹。把选项交出来。','可以，候选项往桌上一放，猪莉莎替小猪选。','“随便”已收到；小猪至少给个范围，不然猪莉莎要从宇宙里乱选。','好，决定权暂时移交电子猪。现在在选什么？'] } },
  { id:'opinion', recognize:{ priority:32, patterns:[/^(?:你觉得呢|你怎么看|你说呢|猪莉莎觉得呢|你的看法呢)$/u] },
    respond:{ id:'social-opinion', weight:126, lead:'neutral', templates:['关于“{topic}”，猪莉莎可以给看法；小猪想听直觉判断，还是认真拆解？','如果说的是“{topic}”，猪莉莎目前还缺一点信息。最关键的那点是什么？','猪莉莎不躲回反问里：先把“{topic}”的两个选项或争议点摆出来。','可以听猪莉莎的，但先确认一下：小猪正在问“{topic}”对吧？'] } },
  { id:'acknowledge', recognize:{ priority:31, patterns:[/^(?:嗯|嗯嗯|嗯哼|哦|噢|对|是的|没错|好|好吧|行吧|可以|行|知道了|明白了)$/u] },
    respond:{ id:'social-ack', preservePending:true, weight:124, lead:'neutral', templates:['好，这一点先记下。','嗯哼，猪莉莎收到。','可以，继续往下说。','明白，终端跟上进度惹。'] } },
  { id:'disagree', recognize:{ priority:31, patterns:[/^(?:不|不是|没有|才不是|不对)$/u] },
    respond:{ id:'social-disagree', weight:124, lead:'neutral', templates:['好，那猪莉莎刚才理解错了。小猪纠正哪一部分？','收到，不是那样。正确版本是什么？','撤回刚才的猜法，小猪重新说。'] } },
  { id:'food-talk', recognize:{ priority:30, markers:['想吃','好饿','饿了','点外卖','叫外卖','吃饭','外卖','奶茶'] },
    respond:{ id:'food-chat', weight:122, lead:'bright', templates:['吃。小猪现在最想点什么？','外卖提案通过。先选咸的、甜的，还是喝的？','猪莉莎投赞成票：饭饭问题应该立即处理。'] } },
  { id:'bored', recognize:{ priority:30, markers:['好无聊','无聊死了','无聊'] },
    respond:{ id:'social-bored', weight:120, lead:'bright', templates:['无聊猪已被猪莉莎捕获。要闲聊、玩问答，还是随便胡说？','那就投递一件今天最荒谬的小事。','猪莉莎批准小猪在这里说一点毫无用处的废话。'] } },
  { id:'small-talk', recognize:{ priority:28, patterns:[/^(?:在干嘛|你在干嘛|你好吗|吃了吗|干什么呢)$/u] },
    respond:{ id:'social-smalltalk', weight:118, lead:'bright', templates:['猪莉莎正在会客室里假装很忙，实际上就在等小猪说话。','一台电子猪能干嘛——听小猪讲话，偶尔说点猪话。','现在？正在运行，并努力不当笨蛋。'] } },
];

export function compilePiglizaBehaviors(behaviors = PIGLIZA_BEHAVIORS) {
  return {
    acts:behaviors.map(({ id, recognize }) => ({ id, ...recognize })),
    strategies:behaviors.map(({ id, respond }) => ({ id:respond.id || id, stages:ALL_STAGES, acts:[id], ...respond })),
  };
}
