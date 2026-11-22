import assert from 'node:assert/strict';
import { PiglizaEngine } from '../assets/js/pigliza-engine.js';
import { analyzePiglizaText } from '../assets/js/pigliza-analyzer.js';
import { estimatePiglizaResponseSpace, PIGLIZA_LEADS } from '../assets/js/pigliza-realizer.js';
import { PIGLIZA_DATA } from '../assets/js/pigliza-rules.js';

const createEngine = () => new PiglizaEngine(PIGLIZA_DATA, { random:() => 0 });

assert.ok(estimatePiglizaResponseSpace(PIGLIZA_DATA) >= 1000);
assert.equal(new Set(PIGLIZA_DATA.strategies.map(strategy => strategy.id)).size, PIGLIZA_DATA.strategies.length);
for (const strategy of PIGLIZA_DATA.strategies) {
  assert.ok(PIGLIZA_LEADS[strategy.lead], strategy.id);
  for (const template of strategy.templates) {
    const slots = [...template.matchAll(/\{(\w+)\}/gu)].map(match => match[1]);
    assert.ok(slots.every(slot => ['topic','feeling','metaphor'].includes(slot)), `${strategy.id}: ${template}`);
  }
}

const analysis = analyzePiglizaText('我不知道为什么最近考试让我很焦虑', PIGLIZA_DATA);
assert.equal(analysis.primary.primary.id, 'anxiety');
assert.equal(analysis.primary.topic, '考试');
assert.ok(analysis.primary.acts.includes('uncertain'));

const progression = createEngine();
const replies = Array.from({ length:4 }, () => progression.respond('最近考试压力真的很大'));
assert.ok(new Set(replies).size >= 3);
assert.equal(progression.getState().turn, 4);

const relief = createEngine();
relief.respond('我最近很焦虑');
assert.match(relief.respond('但现在已经不焦虑了'), /轻|没有之前|缓/);

const continuity = createEngine();
continuity.respond('朋友最近不理我');
assert.match(continuity.respond('就是昨天那件事'), /昨天|关系|对方/);

const restoredContinuity = createEngine();
restoredContinuity.respond('朋友最近不理我');
const restoredContext = createEngine();
restoredContext.setState(restoredContinuity.getState());
assert.match(restoredContext.respond('就是昨天那件事'), /昨天|关系|对方/);

const pronoun = createEngine();
pronoun.respond('主要是明天的考试');
assert.match(pronoun.respond('它让我喘不过气'), /考试|压力|喘不过气/);

const corpus = [
  '学业压力…还有自我焦虑','爸爸，我最近学业压力很大','还有自我焦虑','这个问题很困难',
  '我想休息','我记得小时候下雨','所有人都觉得我很差','我很开心今天数学被老师夸了',
  '朋友最近不理我了','你觉得我是不是太懒了','我不能把所有事情都做好','因为最近睡得太晚所以没精神',
];
for (const input of corpus) {
  const reply = createEngine().respond(input);
  assert.doesNotMatch(reply, /\{\w+\}|undefined|null|“”/u, input);
  assert.ok(reply.length >= 8 && reply.length <= 180, input);
}

assert.equal(analyzePiglizaText('这个问题很困难', PIGLIZA_DATA).primary.primary, null);

console.log('pigliza architecture tests passed');
