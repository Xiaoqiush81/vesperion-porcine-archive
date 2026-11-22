const STAGES = ['clarify','deepen','contrast','action'];
export const piglizaStageForTurn = turn => STAGES[Math.max(0, turn) % STAGES.length];

function matches(strategy, frame) {
  if (strategy.negated !== undefined && strategy.negated !== frame.negated) return false;
  if (frame.negated && strategy.negated !== true && strategy.valence) return false;
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
  // Questions with no recognised intent must not masquerade as statements.
  // This gate is independent of occupation, topic and vocabulary.
  const explicitAct = analysis.frames.some(frame => frame.acts.some(act => act !== 'statement'));
  if (!explicitAct && /[?？]|^(?:what|why|how|when|where|who)\b|是什么|怎么|如何|为什么/iu.test(analysis.text)) {
    return { frame:analysis.primary, stage, score:0, strategy:{
      id:'unknown-question', meta:true, lead:'neutral', templates:[
        '这句问题猪莉莎还不能可靠回答。可以先告诉猪莉莎，其中最需要解释的词或事情是什么。',
      ],
    } };
  }
  let best = null;
  for (const frame of analysis.frames) for (const strategy of data.strategies) {
    if (!matches(strategy, frame)) continue;
    if (state.grounding?.mode === 'casual' && !strategy.meta && !strategy.id.startsWith('social-') && strategy.id !== 'food-chat') continue;
    // Reflective strategies need evidence of an emotional topic. A desire or
    // causal connector alone says nothing about the speaker wanting counselling.
    if (!strategy.meta && !strategy.id.startsWith('social-') && strategy.id !== 'food-chat'
      && !frame.primary && !['topic-open'].includes(strategy.id)) continue;
    const value = score(strategy, frame, stage, state);
    if (!best || value > best.score) best = { frame, strategy, score:value, stage };
  }
  if (!best && state.grounding?.mode === 'casual') return { frame:analysis.primary, stage, score:0, strategy:{
    id:'casual-follow', meta:true, lead:'bright', templates:['咪，猪莉莎听着。然后呢？','噢？这件事后来怎么样了？'],
  } };
  return best;
}
