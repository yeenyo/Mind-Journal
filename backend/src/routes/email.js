import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { supabaseAdmin } from '../lib/supabase.js';
import {
  config,
  sendAccountabilityCheckIn,
  sendConfirmation,
  sendMonthlyReport,
  sendWeeklyDigest,
  templates,
} from '../services/email.js';

const router = Router();

const TYPES = ['weekly_digest', 'accountability', 'monthly_report', 'welcome'];
const RESPONSES = new Set(['good', 'mixed', 'struggled']);

// Representative data for test sends and previews. Real accounts rarely have
// every pattern present at once, and a test that silently skips half the
// template isn't testing the template.
function sampleInsights() {
  const day = (offset) => new Date(Date.now() - offset * 86_400_000).toISOString();
  return {
    analysedEntries: 5,
    totalEntries: 6,
    topTrigger: 'the quarterly report',
    avoidanceTriggers: [
      { trigger: 'the quarterly report', frequency: 4, firstSeen: day(6) },
      { trigger: 'replying to the landlord', frequency: 3, firstSeen: day(5) },
      { trigger: 'booking the dentist', frequency: 2, firstSeen: day(3) },
      { trigger: 'the tax return', frequency: 1, firstSeen: day(1) },
    ],
    timeBlindness: [
      { date: day(5), indicators: ['Sat down at 9, looked up and it was gone 1pm'] },
      { date: day(3), indicators: ['“Five more minutes” turned into the whole evening'] },
    ],
    emotionalTrend: [
      { date: day(6), intensity: 4, type: 'overwhelm' },
      { date: day(5), intensity: 7, type: 'frustration' },
      { date: day(3), intensity: 8, type: 'overwhelm' },
      { date: day(2), intensity: 5, type: 'rejection sensitivity' },
      { date: day(1), intensity: 3, type: 'overwhelm' },
    ],
    hyperfocus: [{ date: day(4), topic: 'reorganising the bookshelf' }],
    timeEstimation: [
      { date: day(5), estimatedMinutes: 30, actualMinutes: 145 },
      { date: day(2), estimatedMinutes: 60, actualMinutes: 90 },
    ],
    timeTotals: { estimatedMinutes: 90, actualMinutes: 235, underestimatePct: 161 },
    strategies: [
      {
        key: 'avoidance',
        pattern: 'Tasks with an unclear first step',
        blurb: 'The blocker is almost never the work — it is not knowing what "start" means.',
        techniques: [
          'Write the first physical action, not the task ("open the spreadsheet", not "do the report")',
          'Set a two-minute timer and stop when it goes off, whether or not you want to',
          'Do the ambiguous bit while talking to someone, even about something else',
        ],
      },
      {
        key: 'time',
        pattern: 'Estimates running short',
        blurb: 'Your guesses came in around a third of the real duration this month.',
        techniques: ['Multiply your instinct by three', 'Record actuals for two weeks before trusting a new estimate'],
      },
    ],
  };
}

/**
 * Renders any template without sending. This is the fast loop for checking HTML
 * across clients — open it in a browser, or pipe it into Litmus/inbox testing —
 * without burning sends or sitting through a delivery round trip.
 *
 * Authenticated, because the rendered output embeds an unsubscribe URL.
 */
router.get('/preview', requireAuth, async (req, res) => {
  const type = String(req.query.type ?? 'weekly_digest');
  if (!TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${TYPES.join(', ')}` });
  }

  const common = {
    name: req.user.email?.split('@')[0] ?? 'you',
    appUrl: config.APP_URL,
    unsubscribeUrl: `${config.API_URL}/api/email/unsubscribe?token=preview`,
  };

  let rendered;
  if (type === 'weekly_digest') {
    rendered = templates.weeklyDigest({ ...common, insights: sampleInsights() });
  } else if (type === 'accountability') {
    rendered = templates.accountabilityCheckIn({
      ...common,
      checkInUrl: `${config.API_URL}/api/email/check-in?token=preview`,
    });
  } else if (type === 'monthly_report') {
    rendered = templates.monthlyReport({
      ...common,
      monthLabel: new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
      insights: sampleInsights(),
      previous: { analysedEntries: 3, avoidanceTriggers: [{}, {}, {}, {}, {}, {}], hyperfocus: [] },
    });
  } else {
    rendered = templates.welcome(common);
  }

  res.set('Content-Type', 'text/html; charset=utf-8').send(rendered.html);
});

// Test send. Premium-gated in the service too, so this route being reachable is
// not what authorises the send.
router.post('/test', requireAuth, async (req, res) => {
  const type = String(req.body?.type ?? 'weekly_digest');
  if (!TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${TYPES.join(', ')}` });
  }
  if (!config.configured) {
    return res.status(503).json({ error: 'RESEND_API_KEY is not set on the server.' });
  }

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('subscription_tier')
    .eq('id', req.user.id)
    .single();

  if (profile?.subscription_tier !== 'premium') {
    return res.status(403).json({ error: 'Email testing is Premium only.', code: 'PREMIUM_REQUIRED' });
  }

  let result;
  if (type === 'weekly_digest') {
    result = await sendWeeklyDigest(req.user.id, sampleInsights(), { force: true });
  } else if (type === 'accountability') {
    result = await sendAccountabilityCheckIn(req.user.id, { force: true });
  } else if (type === 'monthly_report') {
    result = await sendMonthlyReport(
      req.user.id,
      {
        insights: sampleInsights(),
        previous: { analysedEntries: 3, avoidanceTriggers: [{}, {}, {}], hyperfocus: [] },
        monthLabel: new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
      },
      { force: true },
    );
  } else {
    result = await sendConfirmation(req.user.id);
  }

  const status = result.status === 'success' ? 200 : result.status === 'skipped' ? 200 : 502;
  res.status(status).json({ type, ...result });
});

// --- Links opened from a mail client. No session exists, so the token is the
// --- credential and every lookup goes through the service-role client.

function page(title, message) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f3f4f6;">
<div style="max-width:520px;margin:64px auto;padding:32px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;">
<h1 style="margin:0 0 12px;font-size:20px;color:#111827;">${title}</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">${message}</p>
<a href="${config.APP_URL}/settings" style="display:inline-block;padding:12px 22px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Manage email settings</a>
</div></body></html>`;
}

async function unsubscribe(req, res) {
  const token = String(req.query.token ?? '');
  if (!token) return res.status(400).send(page('Link incomplete', 'That unsubscribe link is missing its token.'));

  // Turning off `opted_in` rather than the individual flags means re-enabling one
  // digest later can't silently resurrect the others.
  const { data, error } = await supabaseAdmin
    .from('email_preferences')
    .update({ opted_in: false, updated_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .select('user_id')
    .maybeSingle();

  if (error || !data) {
    return res.status(404).send(page('Link not recognised', 'That link has expired or already been used. You can manage everything from your settings.'));
  }

  res.send(page('Unsubscribed', 'You won’t get any more digests, check-ins, or reports. Your entries and account are untouched.'));
}

router.get('/unsubscribe', unsubscribe);
// Gmail and Outlook POST to the List-Unsubscribe URL for their native button.
router.post('/unsubscribe', unsubscribe);

router.get('/check-in', async (req, res) => {
  const token = String(req.query.token ?? '');
  const response = String(req.query.response ?? '');

  if (!RESPONSES.has(response)) {
    return res.status(400).send(page('Unknown answer', 'That check-in link was not one of the three options.'));
  }

  const { data: preferences } = await supabaseAdmin
    .from('email_preferences')
    .select('user_id')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (!preferences) {
    return res.status(404).send(page('Link not recognised', 'That check-in link has expired.'));
  }

  const { error } = await supabaseAdmin
    .from('accountability_responses')
    .insert({ user_id: preferences.user_id, response });

  if (error) {
    return res.status(500).send(page('Couldn’t record that', 'Something went wrong saving your answer. It’s not lost — try the link again.'));
  }

  const acknowledgement = {
    good: 'Logged as a good week. Next week’s digest will have something to compare against.',
    mixed: 'Logged as mixed. That’s most weeks, for most people.',
    struggled: 'Logged. A hard week is data too — it’s not a failed streak, because there isn’t one.',
  }[response];

  res.send(page('Thanks — that’s recorded', acknowledgement));
});

export default router;
