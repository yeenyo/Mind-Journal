import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { analyzeEntry } from '../lib/anthropic.js';

const router = Router();

const FREE_TIER_ENTRY_LIMIT = 3;

// In-memory guard: max one Claude analysis per user per 5 minutes.
// Fine for a single-instance MVP; swap for a DB-backed timestamp check
// (or Redis) if the backend ever runs multiple instances.
const lastAnalysisAt = new Map();
const ANALYSIS_COOLDOWN_MS = 5 * 60 * 1000;

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

  const { data: insights } = await req.supabase
    .from('insights')
    .select('themes, analysis_text, created_at')
    .eq('entry_id', req.params.id)
    .maybeSingle();

  res.json({ ...entry, insight: insights ?? null });
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

  if (profile.subscription_tier === 'free') {
    const { count, error: countError } = await req.supabase
      .from('entries')
      .select('id', { count: 'exact', head: true });

    if (countError) return res.status(500).json({ error: countError.message });
    if (count >= FREE_TIER_ENTRY_LIMIT) {
      return res.status(403).json({
        error: `Free plan is limited to ${FREE_TIER_ENTRY_LIMIT} entries. Upgrade to write more.`,
        code: 'ENTRY_LIMIT_REACHED',
      });
    }
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  const { data: entry, error: insertError } = await req.supabase
    .from('entries')
    .insert({ user_id: req.user.id, content, word_count: wordCount })
    .select()
    .single();

  if (insertError) return res.status(500).json({ error: insertError.message });

  let insight = null;
  const now = Date.now();
  const lastRun = lastAnalysisAt.get(req.user.id) ?? 0;

  if (now - lastRun >= ANALYSIS_COOLDOWN_MS) {
    try {
      const analysis = await analyzeEntry(content);
      lastAnalysisAt.set(req.user.id, now);

      const { data: savedInsight, error: insightError } = await req.supabase
        .from('insights')
        .insert({
          user_id: req.user.id,
          entry_id: entry.id,
          themes: analysis.themes,
          analysis_text: analysis.analysis_text,
        })
        .select()
        .single();

      if (!insightError) insight = savedInsight;
    } catch (err) {
      console.error('[entries] Claude analysis failed:', err.message);
    }
  }

  res.status(201).json({ ...entry, insight });
});

router.delete('/:id', async (req, res) => {
  const { error } = await req.supabase.from('entries').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
