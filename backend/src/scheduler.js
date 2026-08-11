import cron from 'node-cron';
import { supabaseAdmin } from './lib/supabase.js';
import { aggregateInsights } from './lib/insightsAggregate.js';
import { sendAccountabilityCheckIn, sendMonthlyReport, sendWeeklyDigest } from './services/email.js';

// All three schedules run in UTC, per the brief. A day-boundary cron ('1 * *'
// for the monthly job) evaluated in the server's local zone would fire on the
// wrong calendar day for part of the world — pinning `timezone: 'UTC'` on every
// job removes that ambiguity regardless of what TZ the host happens to run in.
const CRON = {
  weekly_digest: '0 9 * * 0', // Sunday 09:00 UTC
  accountability: '0 18 * * 3', // Wednesday 18:00 UTC
  monthly_report: '0 9 1 * *', // 1st of month, 09:00 UTC
};

// Re-entrancy guard. node-cron fires on schedule regardless of whether the
// previous run finished — for ~45 users that's not realistic today, but a
// monthly job that outlives a minute (Resend calls, DB round trips per user)
// must not get a second instance stacked on top of it by a slow morning.
const running = { weekly_digest: false, accountability: false, monthly_report: false };

async function fetchPremiumUsers() {
  // Deliberately not pre-filtered by a join on email_preferences: a Premium
  // user who has never opened Settings has no preferences row yet, and an inner
  // join would silently exclude them from every scheduled email forever. The
  // per-type opt-in check already lives in services/email.js (which creates a
  // default-true-for-Premium row on first contact), so the scheduler asks the
  // same question the manual /api/email/test path asks, and the two can't
  // silently disagree about who gets mailed.
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('subscription_tier', 'premium');
  if (error) throw new Error(`Could not list Premium users: ${error.message}`);
  return data ?? [];
}

// Records a failure that happened before services/email.js ever got called
// (e.g. the insights aggregation query itself failed) — those need a row in
// the same table for the same reason a failed send does: debugging shouldn't
// require knowing which failure mode to look in which place for.
async function logPreSendFailure(userId, type, err) {
  const { error } = await supabaseAdmin.from('email_logs').insert({
    user_id: userId,
    type,
    status: 'failed',
    error_message: String(err.message ?? err).slice(0, 500),
  });
  if (error) console.error(`[scheduler] could not write failure log for ${userId}:`, error.message);
}

function tally(results) {
  const summary = { sent: 0, skipped: 0, failed: 0 };
  for (const result of results) {
    if (result.status === 'success') summary.sent += 1;
    else if (result.status === 'skipped') summary.skipped += 1;
    else summary.failed += 1;
  }
  return summary;
}

// Runs `work(user)` for every Premium user, sequentially rather than in
// parallel. Resend has a rate limit per API key, and firing 40+ sends
// concurrently is the fast way to start hitting 429s mid-batch instead of
// none at all — one at a time is slower but never needs its own retry/backoff
// logic to stay reliable.
async function runForEachPremiumUser(jobKey, label, work) {
  if (running[jobKey]) {
    console.warn(`[scheduler] ${label} job triggered while the previous run is still in progress — skipping.`);
    return { sent: 0, skipped: 0, failed: 0, total: 0, overlapped: true };
  }

  running[jobKey] = true;
  const startedAt = new Date();
  console.log(`[scheduler] ${label} job started at ${startedAt.toISOString()}`);

  try {
    const users = await fetchPremiumUsers();
    const results = [];

    for (const user of users) {
      try {
        results.push(await work(user));
      } catch (err) {
        // work() covers its own try/catch for the send itself (services/email.js
        // never throws) — reaching here means something upstream of the send
        // failed, most likely aggregateInsights. That still needs to be visible
        // in email_logs and must not stop the rest of the batch.
        await logPreSendFailure(user.id, jobKey, err);
        results.push({ status: 'failed', reason: err.message });
      }
    }

    const summary = tally(results);
    console.log(
      `[scheduler] ${label} job finished: ${users.length} Premium users, ${summary.sent} sent, ${summary.skipped} skipped, ${summary.failed} failed (${((Date.now() - startedAt.getTime()) / 1000).toFixed(1)}s)`,
    );
    return { ...summary, total: users.length };
  } finally {
    running[jobKey] = false;
  }
}

export async function runWeeklyDigestJob() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return runForEachPremiumUser('weekly_digest', 'Weekly digest', async (user) => {
    const insights = await aggregateInsights(supabaseAdmin, user.id, { since });
    // sendWeeklyDigest applies the opt-in/flag gate and the "2+ entries" content
    // gate itself — the scheduler doesn't re-check either, so there is exactly
    // one place that decides whether a given user gets this email.
    return sendWeeklyDigest(user.id, insights);
  });
}

export async function runAccountabilityJob() {
  return runForEachPremiumUser('accountability', 'Accountability check-in', (user) =>
    sendAccountabilityCheckIn(user.id),
  );
}

function monthBounds(monthsAgo) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo + 1, 1));
  return { start, end };
}

export async function runMonthlyReportJob() {
  // This job's cron fires on the 1st at 09:00 UTC — the calendar month that
  // just started has almost no data in it yet. "Your ADHD patterns for
  // [Month]" only makes sense read as the month that just ENDED, so this
  // reports on monthsAgo=1 (last month) and compares against monthsAgo=2 (the
  // month before that), not against "this month so far".
  const current = monthBounds(1);
  const previous = monthBounds(2);
  const monthLabel = current.start.toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return runForEachPremiumUser('monthly_report', 'Monthly report', async (user) => {
    const [insights, previousInsights] = await Promise.all([
      aggregateInsights(supabaseAdmin, user.id, {
        since: current.start.toISOString(),
        until: current.end.toISOString(),
      }),
      aggregateInsights(supabaseAdmin, user.id, {
        since: previous.start.toISOString(),
        until: previous.end.toISOString(),
      }),
    ]);
    return sendMonthlyReport(user.id, { insights, previous: previousInsights, monthLabel });
  });
}

const JOB_RUNNERS = {
  weekly_digest: runWeeklyDigestJob,
  accountability: runAccountabilityJob,
  monthly_report: runMonthlyReportJob,
};

export async function runJob(type) {
  const runner = JOB_RUNNERS[type];
  if (!runner) throw new Error(`Unknown job "${type}". Expected one of: ${Object.keys(JOB_RUNNERS).join(', ')}`);
  return runner();
}

let started = false;

export function startScheduler() {
  if (started) return; // guards against double-start if this is ever imported twice
  started = true;

  for (const [type, expression] of Object.entries(CRON)) {
    cron.schedule(expression, () => {
      runJob(type).catch((err) => {
        // The job itself already isolates per-user failures — reaching a catch
        // here means the job function threw before it could, which the process
        // must survive regardless (an unhandled rejection in a cron callback
        // otherwise crashes the whole API on the next scheduled tick).
        console.error(`[scheduler] ${type} job threw unexpectedly:`, err);
      });
    }, { timezone: 'UTC' });
  }

  console.log(
    `[scheduler] started — weekly_digest ${CRON.weekly_digest}, accountability ${CRON.accountability}, monthly_report ${CRON.monthly_report} (all UTC)`,
  );
}
