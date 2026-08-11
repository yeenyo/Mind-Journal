import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { aggregateInsights } from '../lib/insightsAggregate.js';

const router = Router();
router.use(requireAuth);

const RANGE_DAYS = { '7d': 7, '30d': 30, all: null };
const PAID_TIERS = new Set(['pro', 'premium']);

router.get('/', async (req, res) => {
  const range = RANGE_DAYS[req.query.range] !== undefined ? req.query.range : '30d';
  const days = RANGE_DAYS[range];
  const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString() : null;

  const { data: profile, error: profileError } = await req.supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', req.user.id)
    .single();
  if (profileError) return res.status(500).json({ error: profileError.message });

  const tier = profile.subscription_tier;

  // Free tier has no analysis to aggregate, so this is an upsell payload rather
  // than an error — the page renders a locked state from it.
  if (!PAID_TIERS.has(tier)) {
    return res.json({ range, tier, locked: true });
  }

  let aggregate;
  try {
    aggregate = await aggregateInsights(req.supabase, req.user.id, { since });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  res.json({ range, tier, locked: false, ...aggregate });
});

export default router;
