import assert from 'node:assert/strict';
import { translateToPorcine } from '../assets/js/porcine-translator.js';

assert.equal(translateToPorcine('onk onk', 'full', 'clingy'), 'onk onk');
assert.equal(translateToPorcine('爸爸爸爸', 'standard', 'natural').includes('粑粑粑粑咪'), true);
assert.equal(translateToPorcine('不知道', 'standard', 'natural').includes('布吉岛'), true);
assert.equal(translateToPorcine('我回来了', 'standard', 'formal').includes('本猪'), true);
assert.equal(translateToPorcine('我回来了！！！', 'standard', 'piglink').includes('！！！'), false);
assert.match(translateToPorcine('我好烦', 'standard', 'grumpy'), /哼|凑猪|\(ﾟωﾟ\)/);
assert.equal(translateToPorcine('我想抱一下', 'standard', 'clingy').includes('猪咪'), true);

console.log('porcine translator tests passed');
