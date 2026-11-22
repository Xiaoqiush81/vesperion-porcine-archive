import assert from 'node:assert/strict';
import { getPiglizaReplyDelay } from '../assets/js/pigliza.js';

assert.equal(getPiglizaReplyDelay('咪'), 650);
assert.equal(getPiglizaReplyDelay('猪'.repeat(200)), 1600);
assert.ok(getPiglizaReplyDelay('这是一句稍微长一些的回复') > getPiglizaReplyDelay('短句'));

console.log('pigliza ui tests passed');
