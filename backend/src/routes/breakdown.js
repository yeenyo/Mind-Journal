import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { breakdownTask } from '../lib/anthropic.js';

const router = Router();
router.use(requireAuth);

// Every response shape comes from here so the client never has to guess whether
// a field exists on one route but not another.
const COLUMNS = 'id, task, steps, encouragement, created_at, completed_at';

async function getTier(req) {
  const { data, error } = await req.supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', req.user.id)
    .single();
  if (error) throw new Error(error.message);
  return data.subscription_tier;
}

router.get('/', async (req, res) => {
  const { data, error } = await req.supabase
    .from('task_breakdowns')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { task } = req.body;

  if (typeof task !== 'string' || task.trim().length < 3) {
    return res.status(400).json({ error: 'Describe the task in a few words.' });
  }

  let tier;
  try {
    tier = await getTier(req);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  if (tier !== 'premium') {
    return res.status(403).json({
      error: 'Task breakdown is a Premium feature.',
      code: 'PREMIUM_REQUIRED',
    });
  }

  let result;
  try {
    result = await breakdownTask(task.trim());
  } catch (err) {
    console.error('[breakdown] analysis call failed:', err.message);
    return res.status(503).json({ error: 'Analysis unavailable - try again later.' });
  }

  const { data, error } = await req.supabase
    .from('task_breakdowns')
    .insert({
      user_id: req.user.id,
      task: task.trim(),
      steps: result.steps ?? [],
      encouragement: result.encouragement ?? null,
    })
    .select(COLUMNS)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Ticking steps off.
//
// The client sends only an array of booleans, never step text. The stored steps
// are re-read here and just their `done` flags are overwritten, so a tampered or
// stale client can't rewrite what the steps say — the worst it can do is tick
// the wrong box on its own row.
//
// Deliberately NOT gated on Premium: someone who subscribed, generated a
// breakdown, then downgraded should still be able to finish the task they're
// halfway through. Gating generation is the paywall; gating a checkbox on data
// they already own would just be punitive.
router.patch('/:id', async (req, res) => {
  const { done } = req.body;

  if (!Array.isArray(done) || done.some((value) => typeof value !== 'boolean')) {
    return res.status(400).json({ error: 'Expected `done` to be an array of booleans.' });
  }

  const { data: existing, error: readError } = await req.supabase
    .from('task_breakdowns')
    .select(COLUMNS)
    .eq('id', req.params.id)
    .single();

  // RLS already scopes this to the caller, so "not found" and "not yours" are
  // the same outcome and are reported identically on purpose.
  if (readError || !existing) {
    return res.status(404).json({ error: 'Breakdown not found.' });
  }

  const steps = Array.isArray(existing.steps) ? existing.steps : [];
  if (done.length !== steps.length) {
    return res.status(400).json({ error: 'That breakdown has a different number of steps.' });
  }

  const nextSteps = steps.map((step, i) => ({ ...step, done: done[i] }));
  const allDone = nextSteps.length > 0 && nextSteps.every((step) => step.done);

  // completed_at is derived rather than sent by the client: "finished" means
  // every step is ticked, and keeping that rule in one place stops the timestamp
  // and the checkboxes from ever disagreeing. Un-ticking a step clears it.
  const { data, error } = await req.supabase
    .from('task_breakdowns')
    .update({
      steps: nextSteps,
      completed_at: allDone ? (existing.completed_at ?? new Date().toISOString()) : null,
    })
    .eq('id', req.params.id)
    .select(COLUMNS)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
