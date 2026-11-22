const STAGES = ['clarify','deepen','contrast','action'];
export const piglizaStageForTurn = turn => STAGES[Math.max(0, turn) % STAGES.length];

function matches(strategy, frame) {
  if (strategy.acts && !strategy.acts.some(act => frame.acts.includes(act))) return false;
  if (strategy.kinds && !strategy.kinds.includes(frame.primary?.kind)) return false;
  if (strategy.valence && !strategy.valence.includes(frame.primary?.valence)) return false;
  if (strategy.requiresTopic && !frame.topic) return false;
  return strategy.acts || strategy.kinds || strategy.valence || frame.topic;
}

function score(strategy, frame, stage, state) {
  return strategy.weight + (strategy.stages.includes(stage) ? 26 : 0) + frame.score / 20
    - (strategy.id === state.lastStrategy ? 34 : 0) - (frame.primary?.id && frame.primary.id === state.lastGroup ? 5 : 0);
}

export function selectPiglizaPlan(analysis, state, data) {
  const stage = piglizaStageForTurn(state.turn);
  let best = null;
  for (const frame of analysis.frames) for (const strategy of data.strategies) {
    if (!matches(strategy, frame)) continue;
    const value = score(strategy, frame, stage, state);
    if (!best || value > best.score) best = { frame, strategy, score:value, stage };
  }
  return best;
}
