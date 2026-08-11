import { escapeHtml, paragraph, wrap } from './layout.js';

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// Three one-click answers.
//
// The brief asked for "reply with ✓ Mixed ✗". Parsing replies needs inbound mail
// routing (MX records pointed at a provider, a webhook, and a parser that copes
// with quoted history and signatures) — none of which exists here, and all of
// which fails silently when it breaks. Links hit an endpoint directly, work from
// every client, and can't be misread. The emoji stay, since they're the part
// that makes the choice instant to read.
const OPTIONS = [
  { value: 'good', glyph: '✓', label: 'Good', colour: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { value: 'mixed', glyph: '⚠', label: 'Mixed', colour: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { value: 'struggled', glyph: '✗', label: 'Struggled', colour: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
];

export function accountabilityCheckIn({ name, checkInUrl, unsubscribeUrl, appUrl }) {
  const buttons = OPTIONS.map(
    (option) => `<td style="padding:0 4px;" width="33%">
      <a href="${escapeHtml(`${checkInUrl}&response=${option.value}`)}"
         style="display:block;padding:16px 8px;text-align:center;background:${option.bg};border:1px solid ${option.border};border-radius:10px;text-decoration:none;font-family:${FONT};">
        <span style="display:block;font-size:22px;line-height:1.2;color:${option.colour};">${option.glyph}</span>
        <span style="display:block;font-size:14px;font-weight:600;padding-top:6px;color:${option.colour};">${option.label}</span>
      </a>
    </td>`,
  ).join('');

  const body = [
    paragraph(
      `One question${name ? `, ${escapeHtml(name)}` : ''}. No writing needed — just tap the one that fits.`,
    ),
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:22px 0 8px;"><tr>${buttons}</tr></table>`,
    paragraph(
      'That’s it. It takes one tap and it gives next week’s digest something to compare against.',
      { muted: true },
    ),
    paragraph(
      `<a href="${escapeHtml(`${appUrl}/entry/new`)}" style="color:#2563eb;font-weight:600;text-decoration:underline;">Or write about it instead →</a>`,
    ),
  ].join('\n');

  const text = [
    'How did this week go?',
    '',
    'Pick one:',
    ...OPTIONS.map((o) => `${o.glyph} ${o.label}: ${checkInUrl}&response=${o.value}`),
    '',
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n');

  return {
    subject: 'How did this week go?',
    html: wrap({
      title: 'How did this week go?',
      preheader: 'One tap: Good, Mixed, or Struggled.',
      body,
      unsubscribeUrl,
      footerNote: 'You get this because weekly check-ins are on for your account.',
    }),
    text,
  };
}
