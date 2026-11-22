import { PIGLIZA_ACTS, PIGLIZA_CONCEPTS, PIGLIZA_COPY } from './pigliza-lexicon.js?v=20261122-pigliza-3';
import { PIGLIZA_STRATEGIES } from './pigliza-realizer.js?v=20261122-pigliza-3';

// Public data bundle kept stable for the engine constructor and experiments.
export const PIGLIZA_DATA = Object.freeze({
  ...PIGLIZA_COPY,
  concepts:PIGLIZA_CONCEPTS,
  acts:PIGLIZA_ACTS,
  strategies:PIGLIZA_STRATEGIES,
});
