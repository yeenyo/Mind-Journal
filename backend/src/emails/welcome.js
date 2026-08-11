import { button, escapeHtml, heading, paragraph, wrap } from './layout.js';

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// Deliberately short. An onboarding email that opens with a six-step checklist
// is an onboarding email that gets archived — the only ask here is one entry.
export function welcome({ name, appUrl, unsubscribeUrl }) {
  const body = [
    paragraph(
      `You're in${name ? `, ${escapeHtml(name)}` : ''}. One thing to know before you start: there's no streak, no daily reminder, and no minimum. Write when something happened worth recording.`,
    ),
    button(`${appUrl}/entry/new`, 'Write your first entry'),
    heading('What happens after you write'),
    `<ul style="margin:0 0 14px;padding-left:20px;font-family:${FONT};font-size:15px;line-height:1.7;color:#374151;">
      <li>Your entry saves immediately and stays private.</li>
      <li>On a paid plan, it gets read back for avoidance triggers, lost time, and emotional load.</li>
      <li>After a couple of weeks the trends start saying something a single day can't.</li>
    </ul>`,
    paragraph(
      'Two sentences counts as an entry. Messy, unedited, half-finished — that version is more useful to read back than a tidy one.',
      { muted: true },
    ),
    paragraph(
      `Analysis runs on Anthropic's Claude API, under terms that keep your entries out of model training. Never sold.`,
      { muted: true },
    ),
  ].join('\n');

  const text = [
    'Welcome to MindJournal',
    '',
    "There's no streak, no reminder, and no minimum. Write when something happened worth recording.",
    '',
    `Write your first entry: ${appUrl}/entry/new`,
    '',
    'Two sentences counts. Messy is more useful to read back than tidy.',
    '',
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n');

  return {
    subject: 'Welcome to MindJournal',
    html: wrap({
      title: 'Welcome to MindJournal',
      preheader: 'No streaks, no reminders. Just write what happened.',
      body,
      unsubscribeUrl,
      footerNote: null,
    }),
    text,
  };
}
