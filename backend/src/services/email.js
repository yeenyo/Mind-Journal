import { Resend } from 'resend';
import { supabaseAdmin } from '../lib/supabase.js';
import { weeklyDigest } from '../emails/weeklyDigest.js';
import { accountabilityCheckIn } from '../emails/accountabilityCheckIn.js';
import { monthlyReport } from '../emails/monthlyReport.js';
import { welcome } from '../emails/welcome.js';

const { RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env;

if (!RESEND_API_KEY) {
  console.warn('[email] RESEND_API_KEY missing — every send will be skipped until it is set.');
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const FROM = RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
// Unsubscribe and check-in links are opened from a mail client with no session,
// so they hit the API directly rather than the SPA.
const API_URL = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 3001}`;

// The three recurring emails are a Premium feature. Welcome is transactional and
// goes to everyone — it's the receipt for signing up, not marketing.
const PREMIUM_TYPES = new Set(['weekly_digest', 'accountability', 'monthly_report']);
const WEEKLY_DIGEST_MIN_ENTRIES = 2;

// Sends never throw. A failing digest must not take down the caller — for the
// scheduler that lands next, one user's bounce cannot stop the other 400 sends.
// Every outcome is a logged row and a returned status instead.
async function logSend({ userId, type, status, errorMessage = null, providerMessageId = null }) {
  const { error } = await supabaseAdmin.from('email_logs').insert({
    user_id: userId,
    type,
    status,
    error_message: errorMessage ? String(errorMessage).slice(0, 500) : null,
    provider_message_id: providerMessageId,
  });
  if (error) console.error('[email] could not write email_logs row:', error.message);
}

async function getUser(userId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, subscription_tier')
    .eq('id', userId)
    .single();
  if (error || !data) throw new Error(`No user ${userId}: ${error?.message ?? 'not found'}`);
  return data;
}

// Preferences are created on demand rather than by a signup trigger, so users
// who existed before this table did still get a row the first time we consider
// emailing them. Defaults follow the brief: on for Premium, off otherwise.
async function getPreferences(user) {
  const { data: existing } = await supabaseAdmin
    .from('email_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) return existing;

  const isPremium = user.subscription_tier === 'premium';
  const { data, error } = await supabaseAdmin
    .from('email_preferences')
    .insert({
      user_id: user.id,
      opted_in: true,
      weekly_digest: isPremium,
      accountability: isPremium,
      monthly_report: isPremium,
    })
    .select('*')
    .single();

  if (error) throw new Error(`Could not create email preferences: ${error.message}`);
  return data;
}

function linksFor(preferences) {
  const token = preferences.unsubscribe_token;
  return {
    unsubscribeUrl: `${API_URL}/api/email/unsubscribe?token=${token}`,
    checkInUrl: `${API_URL}/api/email/check-in?token=${token}`,
  };
}

function displayName(email) {
  return email?.split('@')[0] ?? '';
}

/**
 * Renders and sends one email, applying every gate in one place so no caller can
 * accidentally bypass the tier check or the opt-out.
 *
 * `force` is for the Premium-only test endpoint: it skips the opt-out and
 * entry-count gates so a test send is predictable, but never skips the tier
 * check — a Free account should not be able to trigger Premium email.
 */
async function send({ userId, type, build, force = false }) {
  if (!resend) {
    await logSend({ userId, type, status: 'skipped', errorMessage: 'RESEND_API_KEY not set' });
    return { status: 'skipped', reason: 'RESEND_API_KEY not set' };
  }

  let user;
  let preferences;
  try {
    user = await getUser(userId);
    preferences = await getPreferences(user);
  } catch (err) {
    await logSend({ userId, type, status: 'failed', errorMessage: err.message });
    return { status: 'failed', reason: err.message };
  }

  if (PREMIUM_TYPES.has(type) && user.subscription_tier !== 'premium') {
    await logSend({ userId, type, status: 'skipped', errorMessage: 'not a Premium account' });
    return { status: 'skipped', reason: 'not a Premium account' };
  }

  if (!force) {
    const typeFlag = { weekly_digest: 'weekly_digest', accountability: 'accountability', monthly_report: 'monthly_report' }[type];
    if (!preferences.opted_in || (typeFlag && !preferences[typeFlag])) {
      await logSend({ userId, type, status: 'skipped', errorMessage: 'opted out' });
      return { status: 'skipped', reason: 'opted out' };
    }
  }

  let payload;
  try {
    payload = await build({ user, preferences, ...linksFor(preferences) });
  } catch (err) {
    await logSend({ userId, type, status: 'failed', errorMessage: err.message });
    return { status: 'failed', reason: err.message };
  }

  // build() returns null when the content gate says there's nothing worth
  // sending — an empty digest is worse than no digest.
  if (!payload) {
    await logSend({ userId, type, status: 'skipped', errorMessage: 'nothing worth sending' });
    return { status: 'skipped', reason: 'nothing worth sending' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: user.email,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      ...(payload.attachments ? { attachments: payload.attachments } : {}),
      headers: {
        // One-click unsubscribe. Gmail and Outlook surface this as a native
        // button, which is both a deliverability signal and the difference
        // between an unsubscribe and a spam report.
        'List-Unsubscribe': `<${linksFor(preferences).unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    if (error) {
      await logSend({ userId, type, status: 'failed', errorMessage: error.message ?? JSON.stringify(error) });
      return { status: 'failed', reason: error.message ?? 'Resend rejected the send' };
    }

    await logSend({ userId, type, status: 'success', providerMessageId: data?.id ?? null });
    return { status: 'success', id: data?.id ?? null, to: user.email };
  } catch (err) {
    await logSend({ userId, type, status: 'failed', errorMessage: err.message });
    return { status: 'failed', reason: err.message };
  }
}

export async function sendWeeklyDigest(userId, insights, { force = false } = {}) {
  return send({
    userId,
    type: 'weekly_digest',
    force,
    build: ({ user, unsubscribeUrl }) => {
      // "Only send if the user has 2+ entries that week" — a digest summarising
      // one entry tells them something they already know and trains them to
      // ignore the next one.
      if (!force && (insights?.analysedEntries ?? 0) < WEEKLY_DIGEST_MIN_ENTRIES) return null;
      return weeklyDigest({
        name: displayName(user.email),
        insights: insights ?? {},
        appUrl: APP_URL,
        unsubscribeUrl,
      });
    },
  });
}

export async function sendAccountabilityCheckIn(userId, { force = false } = {}) {
  return send({
    userId,
    type: 'accountability',
    force,
    build: ({ user, unsubscribeUrl, checkInUrl }) =>
      accountabilityCheckIn({
        name: displayName(user.email),
        checkInUrl,
        unsubscribeUrl,
        appUrl: APP_URL,
      }),
  });
}

/**
 * @param report {{ insights: object, previous?: object, monthLabel?: string,
 *   pdf?: { filename: string, content: Buffer|string } }}
 *
 * The brief asks for a PDF attachment. Nothing here generates one — that needs a
 * PDF library and a decision about how to draw the charts, which is its own
 * piece of work. The plumbing is finished though: pass `report.pdf` and it goes
 * out as a real attachment. Until then the report renders inline, which is what
 * most recipients would open anyway.
 */
export async function sendMonthlyReport(userId, report, { force = false } = {}) {
  return send({
    userId,
    type: 'monthly_report',
    force,
    build: ({ user, unsubscribeUrl }) => {
      const rendered = monthlyReport({
        name: displayName(user.email),
        monthLabel:
          report?.monthLabel ??
          new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
        insights: report?.insights ?? {},
        previous: report?.previous ?? null,
        appUrl: APP_URL,
        unsubscribeUrl,
      });

      if (report?.pdf?.content) {
        rendered.attachments = [
          { filename: report.pdf.filename ?? 'mindjournal-report.pdf', content: report.pdf.content },
        ];
      }
      return rendered;
    },
  });
}

// Named per the brief. Takes a user id rather than a bare address because it
// needs the unsubscribe token and writes a delivery log row, both of which are
// keyed on the user.
export async function sendConfirmation(userId) {
  return send({
    userId,
    type: 'welcome',
    force: true, // transactional: a signup receipt isn't governed by marketing prefs
    build: ({ user, unsubscribeUrl }) =>
      welcome({ name: displayName(user.email), appUrl: APP_URL, unsubscribeUrl }),
  });
}

// Exported for the test route, which renders without sending.
export const templates = { weeklyDigest, accountabilityCheckIn, monthlyReport, welcome };
export const config = { FROM, APP_URL, API_URL, configured: Boolean(resend) };
