import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('[anthropic] ANTHROPIC_API_KEY missing — journal analysis will fail until set.');
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'placeholder',
});

const ANALYSIS_MODEL = 'claude-sonnet-5';

const ANALYSIS_TOOL = {
  name: 'record_analysis',
  description: 'Record the extracted themes/emotions and a brief summary for a journal entry.',
  input_schema: {
    type: 'object',
    properties: {
      themes: {
        type: 'array',
        items: { type: 'string' },
        minItems: 2,
        maxItems: 3,
        description: 'Short theme/emotion labels, e.g. "stress about work", "gratitude".',
      },
      analysis_text: {
        type: 'string',
        description: 'One or two supportive sentences summarizing what stood out in the entry.',
      },
    },
    required: ['themes', 'analysis_text'],
  },
};

export async function analyzeEntry(content) {
  const message = await anthropic.messages.create({
    model: ANALYSIS_MODEL,
    max_tokens: 512,
    system:
      'You are a supportive journaling assistant. Read the entry and extract 2-3 concise ' +
      'themes or emotions, and a brief, warm, non-clinical summary. Never diagnose. Always ' +
      'call record_analysis with your result.',
    tools: [ANALYSIS_TOOL],
    tool_choice: { type: 'tool', name: 'record_analysis' },
    messages: [{ role: 'user', content }],
  });

  const toolUse = message.content.find((block) => block.type === 'tool_use');
  if (!toolUse) {
    throw new Error('Claude did not return a structured analysis.');
  }
  return toolUse.input;
}
