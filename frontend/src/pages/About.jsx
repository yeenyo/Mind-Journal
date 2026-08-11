import { Link } from 'react-router-dom';
import InfoPage, { Prose, Section } from '../components/InfoPage';
import Card from '../components/Card';
import { buttonClasses } from '../lib/buttonStyles';
import { ArrowRightIcon, ClockIcon, HeartIcon, LockIcon, PatternIcon } from '../components/Icons';

const PROMISES = [
  {
    icon: LockIcon,
    title: 'Analysed by Claude, nothing else',
    body: 'Your entries go to Anthropic’s API for analysis, under terms that keep that data out of model training. They never go to OpenAI, Google, or anyone else.',
  },
  {
    icon: HeartIcon,
    title: 'Never sold, never trained on',
    body: 'We don’t sell your data, share it with advertisers, or use your writing to train anything. There is no version of this where your journal becomes someone else’s product.',
  },
  {
    icon: ClockIcon,
    title: 'Yours to take or delete',
    body: 'Export everything as a file whenever you want. Delete your account and it’s gone — entries, analyses, all of it — not archived somewhere for six months.',
  },
];

export default function About() {
  return (
    <InfoPage
      eyebrow="About"
      title="We built the journal we couldn’t find."
      lede="MindJournal is a small project with one goal: help people with ADHD see the patterns they’re living inside, using their own words instead of a questionnaire."
    >
      <Section title="Why this exists">
        <div className="flex flex-col gap-4">
          <Prose>
            Most journaling apps are built for people who already journal. They assume you’ll show up
            daily, fill in a mood wheel, keep a streak alive, and feel bad when you don’t. If that
            worked for you, you probably wouldn’t be reading this page.
          </Prose>
          <Prose>
            The frustrating part isn’t the writing. It’s that after months of entries you still end
            up with a pile of text and no idea what it means. You already knew you had a bad week.
            What you didn’t know was that the same task showed up in eleven entries before you
            finally started it, or that every time you wrote “I’ll just do it tomorrow” you were
            three days from a deadline.
          </Prose>
          <Prose>
            That’s the gap. Writing it down is the easy half. Reading it back honestly — across
            weeks, without your memory editing the story — is the part nobody can do for themselves.
          </Prose>
        </div>
      </Section>

      <Section title="What MindJournal actually does">
        <div className="flex flex-col gap-4">
          <Prose>
            You write whatever happened. Messy, half-sentences, five minutes before bed. No prompts
            you have to answer, no streak to protect, no minimum.
          </Prose>
          <Prose>
            Then it reads the entry for four specific things ADHD tends to produce: what you were
            avoiding and what set it off, where time went missing, how far your estimates were from
            reality, and how loaded the day felt emotionally. Those get collected across every entry
            you’ve written, so the pattern shows up even when a single day doesn’t look like much.
          </Prose>
          <Prose>
            It isn’t therapy and it isn’t a diagnosis. It’s a mirror that doesn’t forget — which,
            for a brain that struggles with working memory and time perception, turns out to be
            worth quite a lot.
          </Prose>
        </div>
      </Section>

      <Section title="Who’s behind it">
        <div className="flex flex-col gap-4">
          <Prose>
            A very small team who got tired of being told to “just use a planner”. We built the first
            version for ourselves after realising we’d each independently kept notes for years
            without ever going back and reading them.
          </Prose>
          <Prose>
            We’re not clinicians. Everything MindJournal describes is drawn from what you wrote, not
            from a clinical assessment. If something it surfaces feels significant, that’s a good
            thing to take to someone qualified — which is exactly why we built the therapist export.
          </Prose>
        </div>
      </Section>

      <Section
        title="Our privacy commitment"
        hint="Your data stays yours. Analysed by Claude, never used to train it. Never sold."
      >
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PROMISES.map(({ icon: PromiseIcon, title, body }, i) => (
            <Card
              as="li"
              key={title}
              className="fade-in stagger-item flex flex-col"
              style={{ '--stagger-index': i }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <PromiseIcon className="h-5 w-5" />
              </span>
              <h3 className="mt-3.5 font-semibold text-gray-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{body}</p>
            </Card>
          ))}
        </ul>
        <Prose className="mt-5">
          The full detail — retention, encryption, what a subprocessor can and can’t see — is in the{' '}
          <Link to="/privacy-and-terms" className="link-underline font-medium text-brand-700">
            privacy policy
          </Link>
          , written in plain English rather than legal boilerplate.
        </Prose>
      </Section>

      <Section title="Start with one entry">
        <Card tone="brand" className="icon-tilt-parent flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Two sentences is a real entry.</h3>
            <p className="mt-1 text-sm text-gray-600">
              Free forever for writing. You only pay if you want the analysis.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link to="/auth/signup" className={buttonClasses()}>
              Sign up free
              <ArrowRightIcon className="icon-tilt h-4 w-4" />
            </Link>
            <Link to="/how-it-works" className={buttonClasses({ variant: 'secondary' })}>
              <PatternIcon className="h-4 w-4" />
              How it works
            </Link>
          </div>
        </Card>
      </Section>
    </InfoPage>
  );
}
