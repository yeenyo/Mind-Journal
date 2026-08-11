// Local-LLM replacement for anthropic.js. Ollama's /api/generate has no tool-use,
// so instead of a forced tool call we ask for JSON directly via format:"json"
// (which constrains decoding to valid JSON, but not to OUR schema — Mistral can
// still omit fields or use the wrong types) and validate/coerce everything
// after parsing.

const OLLAMA_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'mistral';

class OllamaUnavailableError extends Error {}

async function generate(prompt) {
  let response;
  try {
    response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt, format: 'json', stream: false }),
      // Local inference on modest hardware can genuinely take a while; failing
      // fast here would turn "still thinking" into a false "unavailable".
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    // ECONNREFUSED (daemon not running), timeout, DNS failure — all the same
    // to the caller: Ollama isn't answering.
    throw new OllamaUnavailableError(`Could not reach Ollama at ${OLLAMA_URL}: ${err.message}`);
  }

  if (response.status === 404) {
    throw new OllamaUnavailableError(
      `Ollama has no model "${MODEL}" pulled. Run: ollama pull ${MODEL}`,
    );
  }
  if (!response.ok) {
    throw new OllamaUnavailableError(`Ollama returned ${response.status}: ${await response.text()}`);
  }

  const body = await response.json();

  try {
    return JSON.parse(body.response);
  } catch {
    throw new OllamaUnavailableError('Ollama response was not valid JSON.');
  }
}

const ANALYSIS_PROMPT = (content) => `You analyse journal entries written by people with ADHD and \
extract behavioural patterns. Be direct and practical, never clinical, never diagnosing. Validate \
the writer: executive dysfunction is not laziness or a character flaw. Only report patterns that \
are actually present in the entry — use empty arrays and false/null rather than inventing findings.

Analyze this journal entry from someone with ADHD. Extract patterns.

Entry: """
${content}
"""

Respond ONLY with a JSON object using these exact keys and value TYPES — the words below
describe a type, they are not answers to copy:
- avoidance_triggers: array of strings. Each string names ONE task/situation this specific
  writer is avoiding, taken from their words. Empty array if none.
- time_blindness_indicators: array of strings, each a short quote or paraphrase FROM THE ENTRY
  ABOVE showing lost time. Empty array if none.
- emotional_dysregulation: object with "detected" (boolean), "type" (pick exactly ONE of:
  rejection sensitivity, overwhelm, frustration, other — or null if not detected), "intensity"
  (integer 1-10, or null).
- hyperfocus_detected: boolean.
- hyperfocus_topic: string naming what THIS writer hyperfocused on, or null.
- time_estimation: object with "estimated" and "actual" as the durations the writer actually
  wrote (e.g. if they wrote "15 minutes" and "three hours", use those, not any other numbers),
  "difference" as a short description, "estimated_minutes" and "actual_minutes" as those same
  durations converted to integer minutes (three hours = 180). All null if no estimate/actual
  pair appears in the entry.
- adhd_insights: string, 2-3 sentences specific to what THIS entry contains.
- actionable_suggestion: string, one concrete strategy relevant to what THIS entry contains.

Base every field only on the entry text between the """ marks above. Do not invent details.
Respond with the JSON object only, no other text.`;

// Mistral occasionally echoes the prompt's own placeholder text instead of
// extracting from the entry — seen in testing (literal "task1"/"task2").
// Filtering these out is safer than trusting the prompt fix alone.
const PLACEHOLDER_PATTERN = /^task\d+$|placeholder|example/i;

function coerceStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item) => typeof item === 'string' && item.trim().length > 0 && !PLACEHOLDER_PATTERN.test(item.trim()),
  );
}

function coerceIntensity(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(10, Math.max(1, Math.round(n)));
}

function coerceMinutes(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

// Normalises whatever shape Mistral actually returned into the exact shape
// entries.js expects — local models are far less reliable than Claude's
// forced tool-use at sticking to a schema, so this layer is load-bearing.
function normaliseAnalysis(raw) {
  const emotional = raw?.emotional_dysregulation ?? {};
  const timing = raw?.time_estimation ?? {};

  return {
    avoidance_triggers: coerceStringArray(raw?.avoidance_triggers),
    time_blindness_indicators: coerceStringArray(raw?.time_blindness_indicators),
    emotional_dysregulation: {
      detected: Boolean(emotional.detected),
      type: typeof emotional.type === 'string' ? emotional.type : null,
      intensity: coerceIntensity(emotional.intensity),
    },
    hyperfocus_detected: Boolean(raw?.hyperfocus_detected),
    hyperfocus_topic: typeof raw?.hyperfocus_topic === 'string' ? raw.hyperfocus_topic : null,
    time_estimation: {
      estimated: typeof timing.estimated === 'string' ? timing.estimated : null,
      actual: typeof timing.actual === 'string' ? timing.actual : null,
      difference: typeof timing.difference === 'string' ? timing.difference : null,
      estimated_minutes: coerceMinutes(timing.estimated_minutes),
      actual_minutes: coerceMinutes(timing.actual_minutes),
    },
    adhd_insights: typeof raw?.adhd_insights === 'string' ? raw.adhd_insights : '',
    actionable_suggestion:
      typeof raw?.actionable_suggestion === 'string' ? raw.actionable_suggestion : '',
  };
}

export async function analyzeEntry(content) {
  const raw = await generate(ANALYSIS_PROMPT(content));
  return normaliseAnalysis(raw);
}

const BREAKDOWN_PROMPT = (task) => `You break overwhelming tasks into micro-steps for people with \
ADHD who are stuck in paralysis-by-overwhelm. Each step must be a single physical action that can \
be started in under two minutes, ordered so the first step is the easiest possible entry point. No \
pep talk, no theory.

Task to break down: """${task}"""

Respond ONLY with a JSON object using these exact keys and value TYPES:
- steps: array of 4 to 6 objects, each {"step": string, "minutes": integer}. Each "step" must
  describe one real, physical action specific to breaking down THIS task above — not a
  placeholder or a generic instruction. "minutes" is how long that one step takes.
- encouragement: string, one short, non-patronising motivational line specific to this task.

Respond with the JSON object only, no other text.`;

// Steps are stored with their own `done` flag so ticking one off is a rewrite of
// this array rather than a separate table — see the schema comment.
const MAX_STEPS = 6;
const MIN_USABLE_STEPS = 3;

function normaliseBreakdown(raw) {
  const steps = Array.isArray(raw?.steps)
    ? raw.steps
        .filter((s) => s && typeof s.step === 'string' && s.step.trim())
        .map((s) => ({ step: s.step.trim(), minutes: coerceMinutes(s.minutes) ?? 5, done: false }))
    : [];

  // The prompt asks for 4–6. A local model that returns 3 usable steps has still
  // produced something worth showing, so the floor for *rejecting* the response
  // sits below the floor we ask for — failing the whole request would be a worse
  // outcome than a slightly short list.
  if (steps.length < MIN_USABLE_STEPS) {
    throw new OllamaUnavailableError('Ollama returned too few steps to be useful.');
  }

  return {
    steps: steps.slice(0, MAX_STEPS),
    encouragement: typeof raw?.encouragement === 'string' ? raw.encouragement : '',
  };
}

export async function breakdownTask(task) {
  const raw = await generate(BREAKDOWN_PROMPT(task));
  return normaliseBreakdown(raw);
}
