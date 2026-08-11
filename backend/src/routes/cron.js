import { Router } from 'express';
import { runAccountabilityJob, runMonthlyReportJob, runWeeklyDigestJob } from '../scheduler.js';

const router = Router();

// Vercel signs its own Cron Job requests with `Authorization: Bearer
// <CRON_SECRET>` automatically, as long as a CRON_SECRET env var exists on the
// project — no user session is involved, because nobody is logged in when a
// scheduler fires at 9am. That header is the entire authentication for these
// three routes, so a missing or wrong CRON_SECRET must reject the request
// before anything downstream runs.
function requireCronSecret(req, res, next) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error('[cron] CRON_SECRET is not set — refusing every cron request until it is.');
    return res.status(500).json({ error: 'CRON_SECRET not configured.' });
  }
  if (req.headers.authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Invalid or missing cron secret.' });
  }
  next();
}

router.use(requireCronSecret);

// Each route just calls the exact same job function the old in-process
// node-cron scheduler called (see scheduler.js) — the per-user opt-in checks,
// error isolation, and email_logs writes all live there, unchanged. Only the
// trigger mechanism is different: Vercel's clock instead of a timer inside a
// process that no longer stays running.
router.get('/weekly-digest', async (_req, res) => {
  try {
    res.json(await runWeeklyDigestJob());
  } catch (err) {
    console.error('[cron] weekly_digest job threw:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/accountability', async (_req, res) => {
  try {
    res.json(await runAccountabilityJob());
  } catch (err) {
    console.error('[cron] accountability job threw:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/monthly-report', async (_req, res) => {
  try {
    res.json(await runMonthlyReportJob());
  } catch (err) {
    console.error('[cron] monthly_report job threw:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
