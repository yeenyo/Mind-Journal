import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('[anthropic] ANTHROPIC_API_KEY missing — journal analysis will fail until set.');
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'placeholder',
});

const ANALYSIS_MODEL = 'claude-sonnet-5';

// A forced tool call rather than "respond only with JSON" — the API validates
// the shape, so a malformed response is retried by the model instead of
// crashing the parse here.
const ANALYSIS_TOOL = {
  name: 'record_adhd_analysis',
  description: 'Record ADHD-specific patterns extracted from a journal entry.',
  input_schema: {
    type: 'object',
    properties: {
      avoidance_triggers: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Short labels for tasks or situations the writer is avoiding, e.g. "coding", "replying to emails". Empty array if none.',
      },
      time_blindness_indicators: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Quotes or paraphrases showing lost time or misjudged duration, e.g. "lost track of time", "estimated 30 min took 2 hours".',
      },
      emotional_dysregulation: {
        type: 'object',
        properties: {
          detected: { type: 'boolean' },
          type: {
            type: 'string',
            description: 'rejection sensitivity / overwhelm / frustration / other',
          },
          intensity: { type: 'integer', minimum: 1, maximum: 10 },
        },
        required: ['detected'],
      },
      hyperfocus_detected: { type: 'boolean' },
      hyperfocus_topic: { type: 'string', description: 'What they hyperfocused on, if any.' },
      time_estimation: {
        type: 'object',
        properties: {
          estimated: { type: 'string', description: 'As the writer described it, e.g. "30 minutes".' },
          actual: { type: 'string', description: 'As the writer described it, e.g. "2 hours".' },
          difference: { type: 'string', description: 'e.g. "underestimated by 300%".' },
          estimated_minutes: {
            type: 'integer',
            description: 'Estimate normalised to whole minutes, for charting.',
          },
          actual_minutes: {
            type: 'integer',
            description: 'Actual time normalised to whole minutes, for charting.',
          },
        },
      },
      adhd_insights: {
        type: 'string',
        description: '2-3 sentences on what this reveals about their ADHD patterns.',
      },
      actionable_suggestion: {
        type: 'string',
        description: 'One specific, concrete ADHD strategy recommendation.',
      },
    },
    required: ['avoidance_triggers', 'emotional_dysregulation', 'hyperfocus_detected', 'adhd_insights', 'actionable_suggestion'],
  },
};

const ANALYSIS_SYSTEM = [
  'You analyse journal entries written by people with ADHD and extract behavioural patterns.',
  'Be direct and practical, never clinical, never diagnosing. Validate the writer:',
  'executive dysfunction is not laziness or a character flaw. Only report patterns that',
  'are actually present in the entry — return empty arrays and detected:false rather than',
  'inventing findings. Always call record_adhd_analysis with your result.',
].join(' ');

export async function analyzeEntry(content) {
  const message = await anthropic.messages.create({
    model: ANALYSIS_MODEL,
    max_tokens: 1024,
    system: ANALYSIS_SYSTEM,
    tools: [ANALYSIS_TOOL],
    tool_choice: { type: 'tool', name: 'record_adhd_analysis' },
    messages: [
      {
        role: 'user',
        content: `Analyze this journal entry from someone with ADHD. Extract patterns.\n\nEntry:\n${content}`,
      },
    ],
  });

  const toolUse = message.content.find((block) => block.type === 'tool_use');
  if (!toolUse) throw new Error('Claude did not return a structured analysis.');
  return toolUse.input;
}

const BREAKDOWN_TOOL = {
  name: 'record_breakdown',
  description: 'Record a task broken into ADHD-friendly micro-steps.',
  input_schema: {
    type: 'object',
    properties: {
      steps: {
        type: 'array',
        minItems: 3,
        maxItems: 10,
        items: {
          type: 'object',
          properties: {
            step: { type: 'string', description: 'One physical action, small enough to start now.' },
            minutes: { type: 'integer', description: 'Realistic minutes for this step.' },
          },
          required: ['step', 'minutes'],
        },
      },
      encouragement: {
        type: 'string',
        description: 'One short, non-patronising line to reduce activation resistance.',
      },
    },
    required: ['steps', 'encouragement'],
  },
};

export async function breakdownTask(task) {
  const message = await anthropic.messages.create({
    model: ANALYSIS_MODEL,
    max_tokens: 1024,
    system: [
      'You break overwhelming tasks into micro-steps for people with ADHD who are stuck in',
      'paralysis-by-overwhelm. Each step must be a single physical action that can be started',
      'in under two minutes, ordered so the first step is the easiest possible entry point.',
      'No pep talk, no theory. Always call record_breakdown.',
    ].join(' '),
    tools: [BREAKDOWN_TOOL],
    tool_choice: { type: 'tool', name: 'record_breakdown' },
    messages: [{ role: 'user', content: `Break this task into micro-steps: ${task}` }],
  });

  const toolUse = message.content.find((block) => block.type === 'tool_use');
  if (!toolUse) throw new Error('Claude did not return a structured breakdown.');
  return toolUse.input;
}
