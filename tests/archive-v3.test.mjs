import assert from 'node:assert/strict';
import { createArchive } from '../assets/js/archive-transfer.js';
import { ARCHIVE_KEYS, normalizeArchive } from '../assets/js/archive-format.js';

class MemoryStorage {
  constructor(entries = {}) { this.values = new Map(Object.entries(entries)); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const pigliza = {
  version:1,
  messages:[{ role:'bot', content:'咪。' }, { role:'user', content:'我今天好累' }],
  engine:{ memory:['小猪刚才提到累。'], lastChoices:{ 'tired:0':1 }, lastGroup:'tired', lastStrategy:'clarify-affect', turn:3, quit:false },
};
const storage = new MemoryStorage({ [ARCHIVE_KEYS.pigliza]:JSON.stringify(pigliza) });
const archive = createArchive(storage);
assert.equal(archive.version, 3);
assert.deepEqual(archive.data.pigliza, pigliza);

const normalized = normalizeArchive(archive);
assert.deepEqual(JSON.parse(normalized.entries.get(ARCHIVE_KEYS.pigliza)), pigliza);

const groundedArchive = structuredClone(archive);
groundedArchive.data.pigliza.engine.grounding = {
  terms:[{ key:'蓝签', term:'蓝签', meaning:'待复核' }], language:'zh', samples:4,
  meanLength:8.5, style:'brief', mode:'casual',
};
assert.deepEqual(JSON.parse(normalizeArchive(groundedArchive).entries.get(ARCHIVE_KEYS.pigliza)).engine.grounding,
  groundedArchive.data.pigliza.engine.grounding);

const withoutLastGroup = structuredClone(archive);
delete withoutLastGroup.data.pigliza.engine.lastGroup;
assert.equal(JSON.parse(normalizeArchive(withoutLastGroup).entries.get(ARCHIVE_KEYS.pigliza)).engine.lastGroup, null);

const legacyPigliza = structuredClone(archive);
delete legacyPigliza.data.pigliza.engine.lastStrategy;
delete legacyPigliza.data.pigliza.engine.turn;
const legacyState = JSON.parse(normalizeArchive(legacyPigliza).entries.get(ARCHIVE_KEYS.pigliza)).engine;
assert.equal(legacyState.lastStrategy, null);
assert.equal(legacyState.turn, 0);

const legacy = structuredClone(archive);
legacy.version = 2;
delete legacy.data.pigliza;
const legacyNormalized = normalizeArchive(legacy);
assert.equal(legacyNormalized.entries.has(ARCHIVE_KEYS.pigliza), false);

assert.throws(() => normalizeArchive({ ...archive, data:{ ...archive.data, pigliza:{ ...pigliza, messages:[{ role:'intruder', content:'x' }] } } }));

console.log('archive v3 tests passed');
