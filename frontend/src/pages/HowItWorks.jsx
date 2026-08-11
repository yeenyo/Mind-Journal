import { Link } from 'react-router-dom';
import InfoPage, { Prose, Section } from '../components/InfoPage';
import Card from '../components/Card';
import { buttonClasses } from '../lib/buttonStyles';
import {
  ArrowRightIcon,
  ClockIcon,
  CompassIcon,
  ListIcon,
  PatternIcon,
  PencilIcon,
} from '../components/Icons';

const STEPS = [
  {
    icon: PencilIcon,
    title: 'Write what actually happened',
    body: 'Open the app, type for two minutes, close it. No prompts you have to answer, no mood wheel, no streak to keep alive. If you skip four days, nothing breaks and nobody guilt-trips you.',
    detail: 'Stuck on a blank page? Four optional starters drop a half-sentence in for you to finish.',
  },
  {
    icon: PatternIcon,
    title: 'It reads the entry back',
    body: 'Anthropic’s Claude reads what you wrote and pulls out four things: what you were avoiding, where time went missing, how far your estimate was from reality, and how loaded the day felt.',
    detail: 'Takes a few seconds. That one entry is what gets sent — nothing else about your account.',
  },
  {
    icon: ClockIcon,
    title: 'Your patterns build up',
    body: 'One entry is an anecdote. Twenty is a pattern. The Patterns page collects every analysis into trends — which triggers keep recurring, how your time estimates skew, when the hard days cluster.',
    detail: 'Charts come with a plain table view, because sometimes you want the number, not the shape.',
  },
  {
    icon: CompassIcon,
    title: 'You see the trigger, not just the mess',
    body: '“I procrastinate” isn’t useful. “I avoid tasks with an unclear first step, usually after a day with three or more meetings” is something you can plan around.',
    detail: 'Export any entry or your whole history as a PDF for a therapist, coach, or assessment.',
  },
  {
    icon: ListIcon,
    title: 'Get a push when knowing isn’t enough',
    body: 'On Premium, hand over the task that’s been sitting there and get it broken into steps small enough to actually start — plus a weekly check-in you can answer with one word.',
    detail: 'Optional. Plenty of people never need this bit, and that’s a fine place to stop.',
    premium: true,
  },
];

export default function HowItWorks() {
  return (
    <InfoPage
      eyebrow="How it works"
      title="Write it down. Get it read back."
      lede="Five steps, and you only have to do the first one. Here’s exactly what happens between typing an entry and understanding your own week."
    >
      <ol className="flex flex-col gap-4">
        {STEPS.map(({ icon: StepIcon, title, body, detail, premium }, i) => (
          <Card
            as="li"
            key={title}
            className="slide-in-left stagger-item relative"
            style={{ '--stagger-index': i }}
          >
            <div className="flex gap-4 sm:gap-5">
              <div className="flex shrink-0 flex-col items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white tabular-nums">
                  {i + 1}
                </span>
                {/* Connector between steps — makes the list read as a sequence
                    rather than five unrelated cards. Not on the last one. */}
                {i < STEPS.length - 1 && (
                  <span className="hidden w-px flex-1 bg-gray-200 sm:block" aria-hidden="true" />
                )}
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <StepIcon className="h-4.5 w-4.5" />
                  </span>
                  <h2 className="font-semibold text-gray-900">{title}</h2>
                  {premium && (
                    <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                      Premium
                    </span>
                  )}
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-700">{body}</p>
                <p className="mt-2.5 text-sm text-gray-500">{detail}</p>
              </div>
            </div>
          </Card>
        ))}
      </ol>

      <Section title="What it doesn’t do">
        <div className="flex flex-col gap-4">
          <Prose>
            It won’t diagnose you. It won’t tell you that you have ADHD, and it won’t tell you that
            you don’t — it only describes patterns in what you already wrote.
          </Prose>
          <Prose>
            It won’t nag. There are no push notifications, no streak counters, and no emails that
            open with “we miss you”. If writing helps, you’ll come back; if it doesn’t, a reminder
            wasn’t the missing piece.
          </Prose>
          <Prose>
            It won’t replace a therapist, coach, or psychiatrist. What it can do is give them
            something concrete to work from, which is often the hardest thing to produce from memory
            in a 50-minute appointment.
          </Prose>
        </div>
      </Section>

      <Section title="Ready when you are">
        <Card tone="brand" className="icon-tilt-parent flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Step one takes about two minutes.</h3>
            <p className="mt-1 text-sm text-gray-600">
              Writing is free forever. Analysis starts at £9.99/month, cancel whenever.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link to="/auth/signup" className={buttonClasses()}>
              Start writing
              <ArrowRightIcon className="icon-tilt h-4 w-4" />
            </Link>
            <Link to="/pricing-faq" className={buttonClasses({ variant: 'secondary' })}>
              Compare plans
            </Link>
          </div>
        </Card>
      </Section>
    </InfoPage>
  );
}
