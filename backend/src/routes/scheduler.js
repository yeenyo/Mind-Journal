import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { runJob } from '../scheduler.js';

const router = Router();
const JOB_TYPES = ['weekly_digest', 'accountability', 'monthly_report'];

// Runs a full scheduled job on demand — the same function the cron entries
// call, against every Premium user, not just the caller.
//
// That is exactly what the brief asks for, and also exactly why this only
// works outside production: the only check standing between "authenticated
// Premium user" and "trigger an email blast to every Premium subscriber,
// repeatedly, right now" is the Premium check itself — there's no admin role
// in this schema to gate it behind instead. Firing 40+ real sends per click is
// the kind of side effect this codebase's own conventions (see the risky-action
// guidance this session is running under) put behind explicit confirmation, and
// an HTTP endpoint reachable by any paying customer's token can't ask for that
// confirmation. Disabling it once NODE_ENV=production removes the exposure
// without removing the thing it's actually for: exercising the batch job,
// its per-user error isolation, and its summary logging without waiting for
// Sunday 9am UTC.
router.post('/run', requireAuth, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Manual scheduler triggers are disabled in production — they email every Premium user.',
    });
  }

  const type = String(req.body?.job ?? '');
  if (!JOB_TYPES.includes(type)) {
    return res.status(400).json({ error: `job must be one of: ${JOB_TYPES.join(', ')}` });
  }

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('subscription_tier')
    .eq('id', req.user.id)
    .single();

  if (profile?.subscription_tier !== 'premium') {
    return res.status(403).json({ error: 'Triggering the scheduler is Premium only.', code: 'PREMIUM_REQUIRED' });
  }

  console.log(`[scheduler] manual trigger of "${type}" requested by ${req.user.email ?? req.user.id}`);

  try {
    const summary = await runJob(type);
    res.json({ job: type, ...summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
