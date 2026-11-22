import assert from 'node:assert/strict';
import { PiglizaEngine, reflectPorcinePhrase } from '../assets/js/pigliza-engine.js';
import { PIGLIZA_DATA } from '../assets/js/pigliza-rules.js';

const createEngine = () => new PiglizaEngine(PIGLIZA_DATA, { random:() => 0 });

assert.equal(reflectPorcinePhrase('我的朋友说你不了解我'), '你的朋友说猪莉莎不了解你');

const engine = createEngine();
assert.match(engine.getGreeting(), /猪莉莎|会客室/);
assert.match(engine.respond('我觉得自己什么都没做好'), /什么都没做好/);
assert.match(engine.respond('我今天真的好累'), /猪饼|身体|卸下/);
assert.match(engine.respond('我不想活了'), /规则谈话机/);

const first = engine.respond('我想休息');
const second = engine.respond('我想休息');
assert.notEqual(first, second);

const memoryEngine = createEngine();
memoryEngine.respond('我记得小时候下雨');
assert.equal(memoryEngine.getState().memory.length, 1);
assert.match(memoryEngine.respond('今天没什么特别的'), /小时候下雨/);

const state = memoryEngine.getState();
const restored = createEngine();
restored.setState(state);
assert.deepEqual(restored.getState(), state);

console.log('pigliza engine tests passed');
