import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { analyzeEntry } from '../lib/anthropic.js';

const router = Router();

const PAID_TIERS = new Set(['pro', 'premium']);

const INSIGHT_COLUMNS = `avoidance_triggers, time_blindness_indicators, emotional_detected,
  emotional_type, emotional_intensity, hyperfocus_detected, hyperfocus_topic, time_estimated,
  time_actual, time_difference, estimated_minutes, actual_minutes, adhd_insights,
  actionable_suggestion, created_at`;

// Both POST / (first analysis) and POST /:id/analyze (retry) persist the same
// insight shape. One mapping, one place to change when the schema moves — a
// second copy would drift the moment either handler is touched.
function insertInsight(supabase, { userId, entryId, analysis }) {
  const emotional = analysis.emotional_dysregulation ?? {};
  const timing = analysis.time_estimation ?? {};

  return supabase
    .from('insights')
    .insert({
      user_id: userId,
      entry_id: entryId,
      avoidance_triggers: analysis.avoidance_triggers ?? [],
      time_blindness_indicators: analysis.time_blindness_indicators ?? [],
      emotional_detected: Boolean(emotional.detected),
      emotional_type: emotional.detected ? (emotional.type ?? null) : null,
      emotional_intensity: emotional.detected ? (emotional.intensity ?? null) : null,
      hyperfocus_detected: Boolean(analysis.hyperfocus_detected),
      hyperfocus_topic: analysis.hyperfocus_detected ? (analysis.hyperfocus_topic ?? null) : null,
      time_estimated: timing.estimated ?? null,
      time_actual: timing.actual ?? null,
      time_difference: timing.difference ?? null,
      estimated_minutes: timing.estimated_minutes ?? null,
      actual_minutes: timing.actual_minutes ?? null,
      adhd_insights: analysis.adhd_insights ?? null,
      actionable_suggestion: analysis.actionable_suggestion ?? null,
    })
    .select(INSIGHT_COLUMNS)
    .single();
}

router.use(requireAuth);

router.get('/', async (req, res) => {
  const { data, error } = await req.supabase
    .from('entries')
    .select('id, content, word_count, created_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data: entry, error } = await req.supabase
    .from('entries')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Entry not found.' });

  const { data: insight } = await req.supabase
    .from('insights')
    .select(INSIGHT_COLUMNS)
    .eq('entry_id', req.params.id)
    .maybeSingle();

  res.json({ ...entry, insight: insight ?? null });
});

router.post('/', async (req, res) => {
  const { content } = req.body;

  if (typeof content !== 'string' || content.trim().length < 50) {
    return res.status(400).json({ error: 'Entry must be at least 50 characters.' });
  }

  const { data: profile, error: profileError } = await req.supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', req.user.id)
    .single();

  if (profileError) return res.status(500).json({ error: profileError.message });

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  // Writing is unlimited on every tier, including Free — only the AI analysis
  // is gated.
  const { data: entry, error: insertError } = await req.supabase
    .from('entries')
    .insert({ user_id: req.user.id, content, word_count: wordCount })
    .select()
    .single();

  if (insertError) return res.status(500).json({ error: insertError.message });

  if (!PAID_TIERS.has(profile.subscription_tier)) {
    return res.status(201).json({ ...entry, insight: null, analysis_skipped: 'tier' });
  }

  let insight = null;
  let analysisError = null;

  try {
    const analysis = await analyzeEntry(content);

    const { data: savedInsight, error: insightError } = await insertInsight(req.supabase, {
      userId: req.user.id,
      entryId: entry.id,
      analysis,
    });

    if (insightError) analysisError = insightError.message;
    else insight = savedInsight;
  } catch (err) {
    console.error('[entries] analysis failed:', err.message);
    analysisError = 'Analysis unavailable - try again later.';
  }

  // The entry itself saved fine, so this is a 201 either way; the client shows
  // the analysis gap rather than pretending the write failed.
  res.status(201).json({ ...entry, insight, analysis_error: analysisError });
});

// Retry hook for an entry that saved but whose analysis failed (analysis
// provider down, insert error). Deliberately NOT a regenerate: an entry that
// already has an insight gets that insight back rather than a second inference.
router.post('/:id/analyze', async (req, res) => {
  const { data: entry, error: entryError } = await req.supabase
    .from('entries')
    .select('id, content')
    .eq('id', req.params.id)
    .single();

  if (entryError || !entry) return res.status(404).json({ error: 'Entry not found.' });

  const { data: profile, error: profileError } = await req.supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', req.user.id)
    .single();

  if (profileError) return res.status(500).json({ error: profileError.message });

  if (!PAID_TIERS.has(profile.subscription_tier)) {
    return res.status(403).json({ error: 'Analysis is a Pro feature.', code: 'TIER_REQUIRED' });
  }

  const { data: existing, error: existingError } = await req.supabase
    .from('insights')
    .select(INSIGHT_COLUMNS)
    .eq('entry_id', entry.id)
    .maybeSingle();

  if (existingError) return res.status(500).json({ error: existingError.message });
  if (existing) return res.json(existing);

  let analysis;
  try {
    analysis = await analyzeEntry(entry.content);
  } catch (err) {
    console.error('[entries] re-analysis failed:', err.message);
    return res.status(503).json({ error: 'Analysis unavailable - try again later.' });
  }

  // Kept outside the try above so a database failure reports as 500 rather than
  // being blamed on the analysis provider with a misleading 503.
  const { data: insight, error: insightError } = await insertInsight(req.supabase, {
    userId: req.user.id,
    entryId: entry.id,
    analysis,
  });

  if (insightError) return res.status(500).json({ error: insightError.message });

  res.json(insight);
});

router.delete('/:id', async (req, res) => {
  const { error } = await req.supabase.from('entries').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
