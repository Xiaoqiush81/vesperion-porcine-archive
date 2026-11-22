import assert from 'node:assert/strict';
import { PiglizaEngine } from '../assets/js/pigliza-engine.js';
import { PIGLIZA_DATA } from '../assets/js/pigliza-rules.js';

// Unfamiliar domains must not imply psychological motives.
for (const input of ['我想编译一个内核', '我想预约一次试驾', '因为部署结束所以准备发布']) {
  const engine = new PiglizaEngine(PIGLIZA_DATA, { random:() => 0 });
  assert.doesNotMatch(engine.respond(input), /带来什么感觉|挡在|主要原因|有多确定/);
}
for (const input of ['量子纠缠是什么？', 'What is a quasar?']) {
  const engine = new PiglizaEngine(PIGLIZA_DATA, { random:() => 0 });
  assert.match(engine.respond(input), /不能可靠回答|not understand.*reliably/i);
}

const glossary = new PiglizaEngine(PIGLIZA_DATA, { random:() => 0 });
glossary.respond('我们这里蓝签是指待复核');
assert.equal(glossary.getState().memory.length, 0);
assert.match(glossary.respond('蓝签是什么意思？'), /待复核/);
glossary.respond('蓝签指的是已复核');
assert.match(glossary.respond('蓝签是什么意思？'), /已复核/);
const restored = new PiglizaEngine(PIGLIZA_DATA, { random:() => 0 });
restored.setState(glossary.getState());
assert.match(restored.respond('蓝签是什么意思？'), /已复核/);
const migrated = new PiglizaEngine(PIGLIZA_DATA, { random:() => 0 });
migrated.setState({ memory:[JSON.stringify({ termKey:'蓝签', meaning:'旧定义', topic:'蓝签' })] });
assert.equal(migrated.getState().memory.length, 0);
assert.match(migrated.respond('蓝签是什么意思？'), /旧定义/);
assert.match(glossary.respond('今天蓝签好多'), /蓝签/);

const casual = new PiglizaEngine(PIGLIZA_DATA, { random:() => 0 });
casual.respond('别分析我');
assert.doesNotMatch(casual.respond('我今天焦虑死了'), /事实|猜测|最早|哪一部分/);
casual.respond('恢复自动判断');
casual.respond('我今天焦虑死了');
assert.notEqual(casual.getState().lastStrategy, 'casual-follow');

const adaptive = new PiglizaEngine(PIGLIZA_DATA, { random:() => 0 });
adaptive.respond('我最近考试压力很大');
const rejectedStrategy = adaptive.getState().lastStrategy;
adaptive.respond('别这么问');
assert.equal(adaptive.getState().grounding.bias[rejectedStrategy], -8);

const english = new PiglizaEngine(PIGLIZA_DATA, { random:() => 0 });
assert.match(english.respond('I had a long day.'), /listening|next/i);
english.respond('ETA means estimated arrival');
assert.match(english.respond('What does ETA mean?'), /estimated arrival/i);
