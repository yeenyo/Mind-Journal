import { barChart, callout, escapeHtml, heading, paragraph, statRow, wrap } from './layout.js';

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function deltaLine(current, previous, { label, invert = false }) {
  if (previous == null || current == null) return null;
  const diff = current - previous;
  if (diff === 0) return `${label}: unchanged from last month.`;
  const better = invert ? diff < 0 : diff > 0;
  const direction = diff > 0 ? 'up' : 'down';
  return `${label}: ${direction} ${Math.abs(diff)} on last month${better ? '' : ''}.`;
}

// Groups the month's intensity readings into weeks so the chart stays readable
// — 30 daily bars in a 600px email is a smear.
function weeklyMood(points) {
  if (!points.length) return [];
  const byWeek = new Map();
  for (const point of points) {
    const date = new Date(point.date);
    const week = Math.floor((date.getDate() - 1) / 7) + 1;
    if (!byWeek.has(week)) byWeek.set(week, []);
    byWeek.get(week).push(point.intensity);
  }
  return [...byWeek.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([week, values]) => ({
      label: `Wk ${week}`,
      value: Math.round(values.reduce((sum, v) => sum + v, 0) / values.length),
    }));
}

export function monthlyReport({ name, monthLabel, insights, previous, appUrl, unsubscribeUrl }) {
  const triggers = insights.avoidanceTriggers ?? [];
  const hyperfocus = insights.hyperfocus ?? [];
  const mood = weeklyMood(insights.emotionalTrend ?? []);

  const sections = [];

  sections.push(
    paragraph(
      `A month of your own writing, summarised${name ? `, ${escapeHtml(name)}` : ''}. Nothing here is a diagnosis — it's what you wrote, counted up.`,
    ),
  );

  sections.push(
    statRow([
      { label: 'Entries', value: String(insights.analysedEntries ?? 0), hint: 'analysed' },
      { label: 'Triggers', value: String(triggers.length), hint: 'distinct' },
      { label: 'Hyperfocus', value: String(hyperfocus.length), hint: 'sessions' },
    ]),
  );

  if (triggers.length) {
    sections.push(heading(`What you avoided most in ${monthLabel}`));
    const rows = triggers
      .slice(0, 5)
      .map(
        (trigger, i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-family:${FONT};font-size:14px;color:#374151;">
          <span style="color:#9ca3af;padding-right:8px;">${i + 1}.</span>${escapeHtml(trigger.trigger)}
        </td>
        <td align="right" style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-family:${FONT};font-size:13px;color:#6b7280;white-space:nowrap;">
          ${trigger.frequency}×
        </td>
      </tr>`,
      )
      .join('');
    sections.push(
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:4px 0 8px;">${rows}</table>`,
    );
  }

  if (mood.length >= 2) {
    sections.push(heading('Emotional load across the month'));
    sections.push(barChart(mood, { max: 10, label: 'Intensity 1–10, averaged per week.' }));
  }

  if (hyperfocus.length) {
    sections.push(heading('Where hyperfocus landed'));
    const topics = hyperfocus
      .map((session) => session.topic)
      .filter(Boolean)
      .slice(0, 5);
    sections.push(
      topics.length
        ? paragraph(topics.map((topic) => escapeHtml(topic)).join(' · '))
        : paragraph(`${hyperfocus.length} sessions, no topic named in the entries.`, { muted: true }),
    );
  }

  // Comparison against last month is the whole point of a monthly cadence — a
  // standalone month is just a longer weekly digest.
  if (previous) {
    const lines = [
      deltaLine(insights.analysedEntries, previous.analysedEntries, { label: 'Entries written' }),
      deltaLine(triggers.length, (previous.avoidanceTriggers ?? []).length, {
        label: 'Distinct triggers',
        invert: true,
      }),
      deltaLine(hyperfocus.length, (previous.hyperfocus ?? []).length, { label: 'Hyperfocus sessions' }),
    ].filter(Boolean);

    if (lines.length) {
      sections.push(heading('Against last month'));
      sections.push(
        `<ul style="margin:0 0 14px;padding-left:20px;font-family:${FONT};font-size:15px;line-height:1.7;color:#374151;">${lines
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join('')}</ul>`,
      );
    }
  }

  const strategies = insights.strategies ?? [];
  if (strategies.length) {
    sections.push(heading('What to try next month'));
    for (const strategy of strategies.slice(0, 2)) {
      sections.push(
        paragraph(
          `<strong style="color:#111827;">${escapeHtml(strategy.pattern)}</strong> — ${escapeHtml(strategy.blurb)}`,
        ),
      );
      sections.push(
        `<ul style="margin:0 0 14px;padding-left:20px;font-family:${FONT};font-size:14px;line-height:1.7;color:#4b5563;">${(
          strategy.techniques ?? []
        )
          .slice(0, 3)
          .map((technique) => `<li>${escapeHtml(technique)}</li>`)
          .join('')}</ul>`,
      );
    }
  }

  sections.push(
    callout(
      `If you're taking any of this to a therapist, coach, or assessment, the printable version is set up for exactly that.`,
      { tone: 'brand' },
    ),
  );

  sections.push(
    paragraph(
      `<a href="${escapeHtml(`${appUrl}/report`)}" style="color:#2563eb;font-weight:600;text-decoration:underline;">Open the printable report →</a>`,
    ),
  );

  const text = [
    `Your ADHD patterns for ${monthLabel}`,
    '',
    `Entries analysed: ${insights.analysedEntries ?? 0}`,
    `Distinct triggers: ${triggers.length}`,
    `Hyperfocus sessions: ${hyperfocus.length}`,
    triggers.length ? `Top trigger: ${triggers[0].trigger} (${triggers[0].frequency}x)` : null,
    '',
    `Printable report: ${appUrl}/report`,
    '',
    `Unsubscribe: ${unsubscribeUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject: `Your ADHD patterns for ${monthLabel}`,
    html: wrap({
      title: `Your ADHD patterns for ${monthLabel}`,
      preheader: triggers.length
        ? `${triggers[0].trigger} topped the month.`
        : `A month of entries, summarised.`,
      body: sections.join('\n'),
      unsubscribeUrl,
      footerNote: 'You get this because monthly reports are on for your account.',
    }),
    text,
  };
}
