const STAGES = ['clarify','deepen','contrast','action'];
export const piglizaStageForTurn = turn => STAGES[Math.max(0, turn) % STAGES.length];

const cleanFocus = value => String(value || '').replace(/[“”'"。！？!?，,　\s]/gu, '').slice(0, 80);

export function createPiglizaDialogue(saved = {}) {
  if (!saved || typeof saved !== 'object') saved = {};
  return {
    concept:typeof saved.concept === 'string' ? saved.concept.slice(0, 80) : null,
    topic:typeof saved.topic === 'string' ? saved.topic.slice(0, 80) : '',
    depth:Number.isInteger(saved.depth) ? Math.min(3, Math.max(0, saved.depth)) : 0,
  };
}

export function advancePiglizaDialogue(saved, frame) {
  const dialogue = createPiglizaDialogue(saved);
  if (!frame?.primary?.id) return dialogue;
  const concept = frame.primary.id, topic = cleanFocus(frame.topic || frame.primary.topic);
  const previousTopic = cleanFocus(dialogue.topic);
  const sameTopic = frame.continuation || (dialogue.concept === concept
    && (!topic || !previousTopic || topic.includes(previousTopic) || previousTopic.includes(topic)));
  return { concept, topic:topic || previousTopic, depth:sameTopic ? Math.min(3, dialogue.depth + 1) : 0 };
}

function matches(strategy, frame) {
  if (strategy.negated !== undefined && strategy.negated !== frame.negated) return false;
  if (frame.negated && strategy.negated !== true && strategy.valence) return false;
  if (strategy.acts && !strategy.acts.some(act => frame.acts.includes(act))) return false;
  if (strategy.unlessActs?.some(act => frame.acts.includes(act))) return false;
  if (strategy.kinds && !strategy.kinds.includes(frame.primary?.kind)) return false;
  if (strategy.valence && !strategy.valence.includes(frame.primary?.valence)) return false;
  if (strategy.requiresTopic && !frame.topic) return false;
  if (strategy.requiresConcept && !frame.primary) return false;
  return strategy.acts || strategy.kinds || strategy.valence || frame.topic;
}

function score(strategy, frame, stage, state) {
  return strategy.weight + (strategy.stages.includes(stage) ? 26 : 0) + frame.score / 20
    + (state.grounding?.bias?.[strategy.id] || 0)
    - (strategy.id === state.lastStrategy ? 34 : 0) - (frame.primary?.id && frame.primary.id === state.lastGroup ? 5 : 0);
}

function candidates(frame, data) {
  if (!data.strategyIndex) return data.strategies;
  const selected = new Set(data.strategyIndex.generic);
  for (const act of frame.acts) for (const strategy of data.strategyIndex.byAct[act] || []) selected.add(strategy);
  return selected;
}

export function selectPiglizaPlan(analysis, state, data) {
  const stage = piglizaStageForTurn(state.dialogue?.depth || 0);
  let best = null;
  for (const frame of analysis.frames) for (const strategy of candidates(frame, data)) {
    if (!matches(strategy, frame)) continue;
    if (strategy.modes && !strategy.modes.includes(state.grounding?.mode || 'adaptive')) continue;
    if (strategy.reflective && (state.grounding?.mode === 'casual' || !frame.primary)) continue;
    const value = score(strategy, frame, stage, state);
    if (!best || value > best.score) best = { frame, strategy, score:value, stage };
  }
  return best;
}
