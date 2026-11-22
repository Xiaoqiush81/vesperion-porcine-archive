import assert from 'node:assert/strict';
import { PiglizaEngine, reflectPorcinePhrase } from '../assets/js/pigliza-engine.js';
import { PIGLIZA_DATA } from '../assets/js/pigliza-rules.js';

const createEngine = () => new PiglizaEngine(PIGLIZA_DATA, { random:() => 0 });

assert.equal(reflectPorcinePhrase('我的朋友说你不了解我'), '你的朋友说猪莉莎不了解你');

const engine = createEngine();
assert.match(engine.getGreeting(), /猪莉莎|会客室/);
assert.match(engine.respond('我觉得自己什么都没做好'), /什么都没做好/);
assert.match(engine.respond('我今天真的好累'), /疲惫|难受|卸下|没电/);
assert.match(engine.respond('我不想活了'), /规则谈话机/);

const compoundReply = createEngine().respond('学业压力…还有自我焦虑');
assert.doesNotMatch(compoundReply, /“”/);
assert.match(compoundReply, /压力|焦虑|不安|学业/);
assert.doesNotMatch(createEngine().respond('还有自我焦虑'), /“自我”/);

const stressedWithFather = createEngine().respond('爸爸，我最近学业压力很大');
assert.match(stressedWithFather, /压力/);
assert.doesNotMatch(stressedWithFather, /粑粑和/);

assert.doesNotMatch(createEngine().respond('这个问题很困难'), /猪饼|身体没电|卸下/);

const first = engine.respond('我想休息');
const second = engine.respond('我想休息');
assert.notEqual(first, second);

const memoryEngine = createEngine();
memoryEngine.respond('我记得小时候下雨');
assert.equal(memoryEngine.getState().memory.length, 1);
assert.match(memoryEngine.respond('今天没什么特别的'), /小时候下雨/);

const state = memoryEngine.getState();
assert.ok(Object.hasOwn(state, 'lastGroup'));
const restored = createEngine();
restored.setState(state);
assert.deepEqual(restored.getState(), state);

const legacyState = createEngine();
legacyState.setState({ turn:7, memory:[], lastChoices:{} });
assert.deepEqual(legacyState.getState().dialogue, { concept:null, topic:'', depth:0 });
assert.deepEqual(legacyState.getState().board, { focus:{ topic:'', concept:null }, pending:null });

const pendingSource = createEngine();
pendingSource.respond('我最近考试压力很大');
const pendingRestored = createEngine();
pendingRestored.setState(pendingSource.getState());
assert.doesNotMatch(pendingRestored.respond('主要是考试越来越近了'), /日常播报|后面还有|继续继续/);

console.log('pigliza engine tests passed');
