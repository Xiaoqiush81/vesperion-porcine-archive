function randomIndex(max) {
  if (!Number.isInteger(max) || max < 1) return 0;
  if (globalThis.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return value[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function shuffle(source) {
  const deck = source.slice();
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(index + 1);
    [deck[index], deck[swap]] = [deck[swap], deck[index]];
  }
  return deck;
}

function orient(card, reversals) {
  return Object.freeze({ card, reversed:Boolean(reversals && randomIndex(2)) });
}

export function createReadingSession({ pool, positions, spreadId, question = '', reversals = false }) {
  if (!Array.isArray(pool) || !pool.length) throw new Error('Tarot card pool is empty.');
  if (!Array.isArray(positions) || !positions.length) throw new Error('Tarot spread has no positions.');

  const deck = shuffle(pool.filter(card => card?.artwork));
  if (deck.length < positions.length + 1) throw new Error('Tarot card pool is too small for this spread.');

  const selected = deck.splice(0, positions.length).map(card => orient(card, reversals));
  let bottom = deck.pop();
  const extras = [];
  const createdAt = new Date().toISOString();

  return {
    spreadId,
    positions:Object.freeze(positions.slice()),
    cards:Object.freeze(selected),
    extras,
    question:String(question).trim().slice(0, 80),
    reversals:Boolean(reversals),
    createdAt,
    drawClarifier() {
      if (!deck.length || extras.some(item => item.position === '解释牌')) return null;
      const item = { ...orient(deck.shift(), reversals), position:'解释牌' };
      extras.push(Object.freeze(item));
      return item;
    },
    drawBottom() {
      if (!bottom || extras.some(item => item.position === '牌堆底牌')) return null;
      const item = { ...orient(bottom, reversals), position:'牌堆底牌' };
      bottom = null;
      extras.push(Object.freeze(item));
      return item;
    },
    toRecord(note = '') {
      const primary = selected.map((item, index) => ({ ...item, position:positions[index] }));
      return {
        createdAt,
        question:String(question).trim().slice(0, 80),
        spreadId,
        cards:[...primary, ...extras].map(item => ({
          name:item.card.name,
          title:item.card.title,
          reversed:item.reversed,
          position:item.position
        })),
        note:String(note).trim().slice(0, 500)
      };
    }
  };
}
