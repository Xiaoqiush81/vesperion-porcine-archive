import { compilePiglizaBehaviors, PIGLIZA_BEHAVIORS } from './pigliza-behaviors.js?v=20261122-pigliza-8';
import { PIGLIZA_ACTS, PIGLIZA_CONCEPTS, PIGLIZA_COPY } from './pigliza-lexicon.js?v=20261122-pigliza-8';
import { PIGLIZA_STRATEGIES } from './pigliza-realizer.js?v=20261122-pigliza-8';

function assertUnique(items, label) {
  const seen = new Set();
  for (const item of items) {
    if (!item?.id || seen.has(item.id)) throw new Error(`Duplicate or missing PIGLIZA ${label}: ${item?.id || '?'}`);
    seen.add(item.id);
  }
}

function indexStrategies(strategies) {
  const generic = [], byAct = {};
  for (const strategy of strategies) {
    if (!strategy.acts?.length) generic.push(strategy);
    else for (const act of strategy.acts) (byAct[act] ||= []).push(strategy);
  }
  for (const strategiesForAct of Object.values(byAct)) Object.freeze(strategiesForAct);
  return Object.freeze({ generic:Object.freeze(generic), byAct:Object.freeze(byAct) });
}

export function compilePiglizaData({ copy = {}, concepts = [], acts = [], strategies = [], behaviors = [] }) {
  const compiled = compilePiglizaBehaviors(behaviors);
  const allConcepts = [...concepts], allActs = [...acts, ...compiled.acts];
  const allStrategies = [...strategies, ...compiled.strategies];
  assertUnique(allConcepts, 'concept'); assertUnique(allActs, 'act'); assertUnique(allStrategies, 'strategy');
  return Object.freeze({ ...copy, concepts:Object.freeze(allConcepts), acts:Object.freeze(allActs),
    strategies:Object.freeze(allStrategies), strategyIndex:indexStrategies(allStrategies) });
}

// Packs can add a complete behaviour in one entry without changing analyzer,
// policy, or realization code. The original bundle remains immutable.
export function extendPiglizaData(data, pack = {}) {
  return compilePiglizaData({ copy:{ ...data, ...(pack.copy || {}) },
    concepts:[...data.concepts, ...(pack.concepts || [])], acts:[...data.acts, ...(pack.acts || [])],
    strategies:[...data.strategies, ...(pack.strategies || [])], behaviors:pack.behaviors || [] });
}

export const PIGLIZA_DATA = compilePiglizaData({ copy:PIGLIZA_COPY, concepts:PIGLIZA_CONCEPTS,
  acts:PIGLIZA_ACTS, strategies:PIGLIZA_STRATEGIES, behaviors:PIGLIZA_BEHAVIORS });
