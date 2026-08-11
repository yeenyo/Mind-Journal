import { barChart, callout, escapeHtml, heading, paragraph, statRow, wrap } from './layout.js';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatMinutes(minutes) {
  if (!minutes) return '0m';
  return minutes >= 60 ? `${(minutes / 60).toFixed(1)}h` : `${minutes}m`;
}

// Collapses the week's emotional-intensity readings onto one point per day, so
// a day with three entries doesn't dominate the shape of the chart.
function dailyMood(points) {
  const byDay = new Map();
  for (const point of points) {
    const day = new Date(point.date).getDay();
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(point.intensity);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, values]) => ({
      label: DAY_LABELS[day],
      value: Math.round(values.reduce((sum, v) => sum + v, 0) / values.length),
    }));
}

export function weeklyDigest({ name, insights, appUrl, unsubscribeUrl }) {
  const topTrigger = insights.topTrigger;
  const timeBlindnessCount = insights.timeBlindness?.length ?? 0;
  const mood = dailyMood(insights.emotionalTrend ?? []);
  const underestimate = insights.timeTotals?.underestimatePct;

  const stats = [
    { label: 'Entries', value: String(insights.analysedEntries ?? 0), hint: 'analysed this week' },
    { label: 'Lost time', value: String(timeBlindnessCount), hint: timeBlindnessCount === 1 ? 'moment' : 'moments' },
  ];
  if (underestimate != null) {
    stats.push({
      label: 'Estimates',
      value: `${underestimate > 0 ? '+' : ''}${underestimate}%`,
      hint: underestimate > 0 ? 'over what you guessed' : 'under what you guessed',
    });
  }

  const sections = [];

  sections.push(
    paragraph(
      `Here's what your entries said about the last seven days${name ? `, ${escapeHtml(name)}` : ''}. No action required — this is just the week handed back to you.`,
    ),
  );
  sections.push(statRow(stats));

  if (topTrigger) {
    sections.push(heading('What you kept avoiding'));
    sections.push(
      paragraph(
        `<strong style="color:#111827;">${escapeHtml(topTrigger)}</strong> came up more than anything else this week.`,
      ),
    );
    const others = (insights.avoidanceTriggers ?? []).slice(1, 4);
    if (others.length) {
      sections.push(
        paragraph(
          `Also recurring: ${others.map((t) => escapeHtml(t.trigger)).join(', ')}.`,
          { muted: true },
        ),
      );
    }
  }

  if (timeBlindnessCount > 0) {
    sections.push(heading('Where the time went'));
    sections.push(
      paragraph(
        `${timeBlindnessCount} ${timeBlindnessCount === 1 ? 'moment' : 'moments'} where time didn't behave the way you expected.`,
      ),
    );
    const quote = insights.timeBlindness?.[0]?.indicators?.[0];
    if (quote) {
      sections.push(
        paragraph(`<em style="color:#6b7280;">“${escapeHtml(quote)}”</em>`, { muted: true }),
      );
    }
  }

  if (insights.timeTotals?.estimatedMinutes > 0) {
    sections.push(
      paragraph(
        `You estimated ${formatMinutes(insights.timeTotals.estimatedMinutes)} of work and it took ${formatMinutes(insights.timeTotals.actualMinutes)}.`,
        { muted: true },
      ),
    );
  }

  if (mood.length >= 2) {
    sections.push(heading('How loaded the days felt'));
    sections.push(barChart(mood, { max: 10, label: 'Emotional intensity, 1–10, averaged per day.' }));
  }

  const hyperfocus = insights.hyperfocus ?? [];
  if (hyperfocus.length) {
    const topic = hyperfocus[0]?.topic;
    sections.push(
      callout(
        `Worth noticing: you hit hyperfocus ${hyperfocus.length} ${hyperfocus.length === 1 ? 'time' : 'times'} this week${topic ? ` — on ${escapeHtml(topic)}` : ''}. Same wiring, opposite direction.`,
      ),
    );
  }

  // One line, and it has to be earned by the data rather than generic praise —
  // an ADHD audience has heard enough "you've got this" to discount it instantly.
  const motivation = topTrigger
    ? `You wrote about ${escapeHtml(topTrigger)} more than once and still showed up to write. Noticing the pattern is the part most people never get to.`
    : `You wrote ${insights.analysedEntries} times this week. That's the whole habit — the patterns come out of it on their own.`;
  sections.push(callout(motivation, { tone: 'brand' }));

  sections.push(
    paragraph(
      `<a href="${escapeHtml(`${appUrl}/insights`)}" style="color:#2563eb;font-weight:600;text-decoration:underline;">See the full picture on your Patterns page →</a>`,
    ),
  );

  const text = [
    `Your ADHD patterns this week`,
    '',
    `Entries analysed: ${insights.analysedEntries ?? 0}`,
    topTrigger ? `Top avoidance trigger: ${topTrigger}` : null,
    `Time blindness moments: ${timeBlindnessCount}`,
    underestimate != null ? `Estimates off by: ${underestimate > 0 ? '+' : ''}${underestimate}%` : null,
    '',
    `Full breakdown: ${appUrl}/insights`,
    '',
    `Unsubscribe: ${unsubscribeUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject: 'Your ADHD patterns this week',
    html: wrap({
      title: 'Your ADHD patterns this week',
      preheader: topTrigger
        ? `${topTrigger} came up most this week.`
        : 'A quick look back at the last seven days.',
      body: sections.join('\n'),
      unsubscribeUrl,
      footerNote: 'You get this because weekly digests are on for your account.',
    }),
    text,
  };
}
