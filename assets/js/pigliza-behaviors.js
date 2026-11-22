const ALL_STAGES = ['clarify','deepen','contrast','action'];

// One entry owns both recognition and response. New one-to-one behaviours belong
// here; shared semantic strategies remain in the compositional strategy table.
export const PIGLIZA_BEHAVIORS = [
  { id:'greeting', recognize:{ priority:34, patterns:[/^(?:嗨|哈喽|你好|早上好|中午好|晚上好|在吗|猪莉莎在吗)$/u] },
    respond:{ id:'social-greeting', weight:130, lead:'bright', templates:['在。猪莉莎的电子猪耳朵已经竖起来惹。','咪，小猪来啦。今天想闲聊还是认真聊？','猪莉莎在线。先投递一条什么消息？'] } },
  { id:'thanks', recognize:{ priority:34, patterns:[/^(?:谢谢|谢谢猪莉莎|谢啦|感谢|好耶谢谢)$/u] },
    respond:{ id:'social-thanks', weight:130, lead:'bright', templates:['不客气，收下一枚电子猪蹄印。','咪，小事一桩。','收到小猪的谢谢惹，猪莉莎尾巴翘一下。'] } },
  { id:'laughter', recognize:{ priority:33, patterns:[/^(?:哈+|哈哈哈+|笑死|笑死我了|绷不住了)$/u] },
    respond:{ id:'social-laughter', weight:128, lead:'bright', templates:['笑成这样，看来这条消息很有猪事。','哈哈哈哈，猪莉莎也跟着抖两下。','不许独笑，发生什么好笑的惹？'] } },
  { id:'insult', recognize:{ priority:33, patterns:[/^(?:笨蛋|笨猪|傻猪|笨蛋猪莉莎|猪莉莎真笨)$/u] },
    respond:{ id:'social-insult', weight:128, lead:'bright', templates:['承认，猪莉莎偶尔是一台笨蛋电子猪。','检测到辱猪事件——但这次好像骂得有道理。','咪！猪莉莎先记仇两秒，然后继续听。'] } },
  { id:'acknowledge', recognize:{ priority:31, patterns:[/^(?:嗯|嗯嗯|对|是的|没错|好|好吧|可以|行|知道了)$/u] },
    respond:{ id:'social-ack', weight:124, lead:'neutral', templates:['好，这一点先记下。','嗯哼，猪莉莎收到。','可以，继续往下说。'] } },
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
