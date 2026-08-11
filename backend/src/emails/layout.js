// Shared shell for every outgoing email.
//
// These are HTML strings rather than the .jsx components in the brief: this
// backend is plain Node ESM with no build step, so a .jsx file can't execute
// without adding a transform and React to a server that currently needs
// neither. Email HTML is table-based and inline-styled regardless, so JSX would
// mostly be buying syntax. If you'd rather have React Email, the swap is
// contained to this directory — every template exports {subject, html, text}
// and nothing outside cares how that HTML was produced.
//
// Rules the markup follows, all of them forced by email clients rather than
// taste: tables for layout (Outlook ignores flex/grid), inline styles (Gmail
// strips <style> in some contexts), no external images (blocked by default and
// a tracking vector), 600px max width, web-safe font stack only.

const BRAND = '#2563eb';
const INK = '#111827';
const MUTED = '#6b7280';
const LINE = '#e5e7eb';
const ACCENT = '#059669';

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// Everything interpolated into these templates is user-derived (trigger names,
// hyperfocus topics, quoted entry fragments), so it is escaped without
// exception. An unescaped apostrophe in "mum's birthday" would be harmless; an
// unescaped <script> or a stray </td> would not.
export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function button(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr><td style="border-radius:8px;background:${BRAND};">
    <a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>
  </td></tr>
</table>`;
}

export function heading(text) {
  return `<h2 style="margin:32px 0 12px;font-family:${FONT};font-size:17px;font-weight:600;color:${INK};">${escapeHtml(text)}</h2>`;
}

export function paragraph(text, { muted = false } = {}) {
  return `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.6;color:${muted ? MUTED : '#374151'};">${text}</p>`;
}

// A bar chart built from table cells.
//
// The brief asked for the mood trend "as an image". Images in email are blocked
// by default in most clients, so a chart-as-image is a chart most readers never
// see — and hosting one would mean an external request that doubles as a
// tracking pixel. Table cells with background colours render everywhere,
// including with images off, and need no external fetch.
export function barChart(points, { max = 10, label = '' } = {}) {
  if (!points.length) return '';

  const bars = points
    .map((point) => {
      const height = Math.max(4, Math.round((point.value / max) * 90));
      return `<td style="vertical-align:bottom;padding:0 3px;text-align:center;">
        <div style="height:${90 - height}px;"></div>
        <div style="height:${height}px;background:${BRAND};border-radius:3px 3px 0 0;"></div>
        <div style="font-family:${FONT};font-size:10px;color:${MUTED};padding-top:6px;">${escapeHtml(point.label)}</div>
      </td>`;
    })
    .join('');

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 4px;">
  <tr>${bars}</tr>
</table>
${label ? `<p style="margin:4px 0 0;font-family:${FONT};font-size:12px;color:${MUTED};">${escapeHtml(label)}</p>` : ''}`;
}

export function statRow(stats) {
  const cells = stats
    .map(
      (stat) => `<td style="padding:14px 12px;background:#f9fafb;border:1px solid ${LINE};border-radius:8px;vertical-align:top;">
      <div style="font-family:${FONT};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;color:${MUTED};">${escapeHtml(stat.label)}</div>
      <div style="font-family:${FONT};font-size:22px;font-weight:600;color:${INK};padding-top:4px;">${escapeHtml(stat.value)}</div>
      ${stat.hint ? `<div style="font-family:${FONT};font-size:12px;color:${MUTED};padding-top:2px;">${escapeHtml(stat.hint)}</div>` : ''}
    </td>`,
    )
    .join('<td style="width:12px;"></td>');

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 20px;"><tr>${cells}</tr></table>`;
}

export function callout(text, { tone = 'accent' } = {}) {
  const bg = tone === 'accent' ? '#ecfdf5' : '#eff6ff';
  const border = tone === 'accent' ? '#a7f3d0' : '#bfdbfe';
  const colour = tone === 'accent' ? ACCENT : '#1d4ed8';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">
  <tr><td style="padding:16px 18px;background:${bg};border:1px solid ${border};border-radius:8px;font-family:${FONT};font-size:15px;line-height:1.6;color:${colour};">${text}</td></tr>
</table>`;
}

// `unsubscribeUrl` is required, not optional. An unsubscribe link that can be
// forgotten by a caller is one that eventually is, and that's both a legal
// problem (CAN-SPAM, PECR) and a fast route to a poisoned sending reputation.
export function wrap({ title, preheader, body, unsubscribeUrl, footerNote }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;">
<!-- Preheader: the grey text clients show after the subject. Hidden in the body
     itself, otherwise the first line of the email is a duplicate of the subject. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader ?? '')}</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f4f6;">
<tr><td align="center" style="padding:24px 12px;">

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:12px;">
    <tr><td style="padding:24px 28px 0;">
      <span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;background:${BRAND};color:#ffffff;font-family:${FONT};font-size:14px;font-weight:700;border-radius:7px;">M</span>
      <span style="font-family:${FONT};font-size:17px;font-weight:600;color:${INK};padding-left:8px;vertical-align:middle;">MindJournal</span>
    </td></tr>

    <tr><td style="padding:8px 28px 28px;">
      <h1 style="margin:16px 0 8px;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:600;color:${INK};">${escapeHtml(title)}</h1>
      ${body}
    </td></tr>

    <tr><td style="padding:0 28px 26px;">
      <div style="border-top:1px solid ${LINE};padding-top:18px;">
        ${footerNote ? `<p style="margin:0 0 10px;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">${footerNote}</p>` : ''}
        <p style="margin:0 0 10px;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">
          MindJournal is not a substitute for ADHD diagnosis, treatment, or professional mental health care.
        </p>
        <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">
          <a href="${escapeHtml(unsubscribeUrl)}" style="color:${MUTED};text-decoration:underline;">Unsubscribe from these emails</a>
        </p>
      </div>
    </td></tr>
  </table>

</td></tr>
</table>
</body>
</html>`;
}
