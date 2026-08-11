// Coping strategies are a static library rather than a Claude call: they stay
// available when the API is down or unfunded, and they're the same well-known
// ADHD techniques every time, which is what makes them trustworthy.
const LIBRARY = {
  'task-initiation': {
    pattern: 'Task initiation / avoidance',
    blurb: 'Starting is the hard part, not the doing. Shrink the start.',
    techniques: [
      'Body double: get on a call with someone and both work in silence.',
      'Two-minute rule: commit only to the first two minutes, then decide again.',
      'Say the first physical action out loud ("open the laptop") before doing it.',
    ],
  },
  'time-blindness': {
    pattern: 'Time blindness',
    blurb: 'Time doesn’t announce itself. Put it outside your head.',
    techniques: [
      'Analogue timer in your eyeline — visible time passing beats a countdown you forget.',
      'Estimate, then multiply by two before committing to anyone else.',
      'Set an end alarm, not a start alarm, when you begin something absorbing.',
    ],
  },
  overwhelm: {
    pattern: 'Overwhelm',
    blurb: 'Overwhelm is a sign the task is too big to see, not too big to do.',
    techniques: [
      'Write every part down, then delete everything that isn’t today.',
      'Pick the step with the least thinking in it and do that one first.',
      'Set a 15-minute limit and stop when it rings, finished or not.',
    ],
  },
  'rejection-sensitivity': {
    pattern: 'Rejection sensitivity',
    blurb: 'The feeling arrives at full volume and then gets quieter. Wait it out.',
    techniques: [
      'Name it out loud: "this is RSD, not new information."',
      'Delay the reply by an hour — draft it, don’t send it.',
      'Check the actual evidence for the interpretation that hurts most.',
    ],
  },
  frustration: {
    pattern: 'Frustration',
    blurb: 'Frustration usually means an unmet need, not a wrong task.',
    techniques: [
      'Stand up and change rooms for two minutes before continuing.',
      'Check the basics first: water, food, movement, noise level.',
      'Switch to a different part of the task rather than pushing the stuck part.',
    ],
  },
  transitions: {
    pattern: 'Transitions',
    blurb: 'Stopping one thing costs as much as starting the next.',
    techniques: [
      'Give yourself a five-minute warning before switching tasks.',
      'Leave a one-line note about where you stopped, so re-entry is cheap.',
      'Use a physical cue for the switch — stand, stretch, refill a glass.',
    ],
  },
  hyperfocus: {
    pattern: 'Hyperfocus',
    blurb: 'This is an asset with a cost. Point it deliberately and cap it.',
    techniques: [
      'Aim hyperfocus at the task that matters before it picks its own target.',
      'Set an alarm before you start, not after you notice.',
      'Put water and food within arm’s reach before you go in.',
    ],
  },
};

function keyForEmotionalType(type) {
  const value = (type ?? '').toLowerCase();
  if (value.includes('rejection')) return 'rejection-sensitivity';
  if (value.includes('overwhelm')) return 'overwhelm';
  if (value.includes('frustrat')) return 'frustration';
  if (value.includes('transition')) return 'transitions';
  return null;
}

// Picks the strategies that match what the user's own entries actually show,
// most-relevant first, so the library reads as personal rather than generic.
export function selectStrategies({ avoidanceCount, timeBlindnessCount, hyperfocusCount, emotionalTypes }) {
  const scored = new Map();

  const add = (key, weight) => {
    if (!key || !LIBRARY[key]) return;
    scored.set(key, (scored.get(key) ?? 0) + weight);
  };

  if (avoidanceCount > 0) add('task-initiation', avoidanceCount);
  if (timeBlindnessCount > 0) add('time-blindness', timeBlindnessCount);
  if (hyperfocusCount > 0) add('hyperfocus', hyperfocusCount);
  for (const type of emotionalTypes ?? []) add(keyForEmotionalType(type), 1);

  return [...scored.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([key, weight]) => ({ key, matchedSignals: weight, ...LIBRARY[key] }));
}
