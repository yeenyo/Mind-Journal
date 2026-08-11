import { Link } from 'react-router-dom';
import { buttonClasses } from '../lib/buttonStyles';
import Card from '../components/Card';
import { ArrowRightIcon, CheckIcon, ClockIcon, CompassIcon, PatternIcon } from '../components/Icons';

const BENEFITS = [
  {
    icon: PatternIcon,
    title: 'See your avoidance patterns',
    body: 'You already know you’re avoiding something. This tells you what, how often, and what set it off — in your own words, not a quiz.',
  },
  {
    icon: ClockIcon,
    title: 'Understand your time blindness',
    body: 'You said 30 minutes. It took two hours. We track the gap so you can plan around the brain you actually have.',
  },
  {
    icon: CompassIcon,
    title: 'Build accountability (finally)',
    body: 'Overwhelming tasks broken into steps small enough to start, plus a weekly check-in you can answer with one word.',
  },
];

const HERO_PROOF = [
  'Unlimited entries on the free plan',
  'No card required',
  'Analysed by Claude, never used to train it',
];

// Display-only. The customer is billed by the Stripe Price objects in
// STRIPE_PRICE_ID_PRO / STRIPE_PRICE_ID_PREMIUM — keep these in sync with them.
const PLANS = [
  {
    name: 'Free',
    price: '£0',
    cadence: 'forever',
    description: 'Write as much as you want.',
    features: [
      'Unlimited journal entries',
      'Encrypted at rest, never sold',
      'Basic entry list',
      'No AI analysis',
    ],
    cta: 'Start writing free',
    featured: false,
  },
  {
    name: 'Pro',
    price: '£9.99',
    cadence: '/month',
    description: 'Find the patterns you can’t see from inside them.',
    features: [
      'ADHD analysis on every entry',
      'Avoidance trigger detection',
      'Time blindness + estimate vs reality',
      'Emotional dysregulation tracking',
      'Hyperfocus detection',
      'Weekly ADHD insights',
      'PDF export for your therapist or coach',
    ],
    cta: 'Get Pro',
    featured: true,
  },
  {
    name: 'Premium',
    price: '£24.99',
    cadence: '/month',
    description: 'For when knowing isn’t enough and you need a push.',
    features: [
      'Everything in Pro',
      'Task breakdown assistant',
      'Weekly accountability check-ins',
      'Strategy library matched to your triggers',
      'Monthly progress report',
      'Email support (24 hour response)',
    ],
    cta: 'Get Premium',
    featured: false,
  },
];

export default function Landing() {
  return (
    <div>
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-brand-50 via-white to-gray-50 px-4 py-16 sm:px-6 sm:py-24">
        {/* Texture, not decoration: the dot grid sits at 7% and fades out downward so
            the hero stops reading as a blank slab without competing with the headline. */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-brand-600 opacity-[0.07] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        >
          <defs>
            <pattern
              id="hero-dots"
              x="50%"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-dots)" />
        </svg>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45rem_22rem_at_50%_-6rem,var(--color-brand-200),transparent_65%)]"
        />

        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-xs font-medium text-brand-700 shadow-card">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden="true" />
            Built for ADHD brains
          </span>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl sm:leading-tight">
            Journaling for ADHD.
            <br className="hidden sm:block" /> Understand your triggers.{' '}
            <span className="text-brand-600">Own your time.</span>
          </h1>
          <p className="mt-5 text-base font-medium text-gray-900 sm:text-lg">
            Your brain isn’t broken. It’s just wired different.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
            Write down what actually happened — messy, unedited, five minutes before bed. MindJournal
            reads it back and finds the avoidance, the lost hours, and the patterns underneath, so you
            can stop guessing why today went the way it did.
          </p>
          <div className="icon-tilt-parent mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/auth/signup" className={buttonClasses({ size: 'lg' })}>
              Sign up for free
              <ArrowRightIcon className="icon-tilt h-4 w-4" />
            </Link>
            <Link to="/auth/login" className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
              Log in
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Not sure yet?{' '}
            <Link to="/how-it-works" className="link-underline font-medium text-brand-700">
              See exactly how it works
            </Link>
            .
          </p>
          <ul className="mt-6 flex flex-col items-center gap-2 text-xs text-gray-500 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-5">
            {HERO_PROOF.map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-3.5 w-3.5 shrink-0 text-accent-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <ul className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {BENEFITS.map(({ icon: BenefitIcon, title, body }, i) => (
            <Card
              as="li"
              key={title}
              interactive
              className="fade-in stagger-item icon-tilt-parent flex flex-col"
              style={{ '--stagger-index': i }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <BenefitIcon className="icon-tilt h-5 w-5" />
              </span>
              <h2 className="mt-4 font-semibold text-gray-900">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{body}</p>
            </Card>
          ))}
        </ul>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-lg font-medium text-gray-900 sm:text-xl">
            “You lost track of time again? That’s not a character flaw.”
          </p>
          <p className="mt-10 text-xs font-medium uppercase tracking-wide text-gray-400">
            What people say
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card as="figure" key={i} className="border-dashed text-left">
                <blockquote className="text-sm text-gray-400">
                  Space for a real user quote — nothing here yet.
                </blockquote>
                <figcaption className="mt-3 text-xs text-gray-400">— name, role</figcaption>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Pick a plan
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Writing is always free. Pay only if you want the analysis.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            <Link to="/pricing-faq" className="link-underline font-medium text-brand-700">
              Full comparison and pricing questions
            </Link>
          </p>
        </div>

        {/* pt-3 leaves room for the featured card's badge, which hangs above its edge. */}
        <ul className="mt-8 grid grid-cols-1 gap-5 pt-3 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Card
              as="li"
              key={plan.name}
              tone={plan.featured ? 'brand' : 'default'}
              style={{ '--stagger-index': i }}
              className={`fade-in stagger-item relative flex flex-col ${
                plan.featured ? 'ring-2 ring-brand-300 lg:-mt-3 lg:mb-3' : ''
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-5 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-card sm:left-6">
                  Most popular
                </span>
              )}
              <h3 className="font-semibold text-gray-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-gray-600">{plan.description}</p>
              <p className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-gray-900">
                  {plan.price}
                </span>
                <span className="text-sm text-gray-500">{plan.cadence}</span>
              </p>
              <ul className="mt-5 flex flex-1 flex-col gap-2.5 border-t border-gray-200 pt-5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                    <span className="min-w-0">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/auth/signup"
                className={`mt-6 ${buttonClasses({
                  variant: plan.featured ? 'primary' : 'secondary',
                  fullWidth: true,
                })}`}
              >
                {plan.cta}
              </Link>
            </Card>
          ))}
        </ul>
      </section>

      {/* The privacy line and the medical disclaimer that used to sit here now
          live in the shared Footer, which App renders on every public page. */}
    </div>
  );
}
