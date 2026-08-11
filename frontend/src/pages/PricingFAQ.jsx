import { Link } from 'react-router-dom';
import InfoPage, { Prose, Section } from '../components/InfoPage';
import Accordion, { AccordionItem } from '../components/Accordion';
import Card from '../components/Card';
import { buttonClasses } from '../lib/buttonStyles';
import { CheckIcon } from '../components/Icons';

// Display-only. The customer is billed by the Stripe Price objects in
// STRIPE_PRICE_ID_PRO / STRIPE_PRICE_ID_PREMIUM — keep in sync with them and
// with the pricing block on the landing page.
const PLANS = [
  { name: 'Free', price: '£0', cadence: 'forever', summary: 'A private journal, unlimited.' },
  { name: 'Pro', price: '£9.99', cadence: '/month', summary: 'Your entries, read back.', featured: true },
  { name: 'Premium', price: '£24.99', cadence: '/month', summary: 'Plus a push to act on it.' },
];

// `true` renders a tick, a string renders as text — some rows are a capability,
// others are a limit worth spelling out.
const MATRIX = [
  {
    group: 'Writing',
    rows: [
      { label: 'Journal entries', free: 'Unlimited', pro: 'Unlimited', premium: 'Unlimited' },
      { label: 'Draft autosave', free: true, pro: true, premium: true },
      { label: 'Writing prompts', free: true, pro: true, premium: true },
      { label: 'Encrypted at rest', free: true, pro: true, premium: true },
      { label: 'CSV export', free: true, pro: true, premium: true },
    ],
  },
  {
    group: 'Analysis',
    rows: [
      { label: 'ADHD analysis per entry', free: false, pro: true, premium: true },
      { label: 'Avoidance trigger detection', free: false, pro: true, premium: true },
      { label: 'Time blindness tracking', free: false, pro: true, premium: true },
      { label: 'Estimate vs reality', free: false, pro: true, premium: true },
      { label: 'Emotional dysregulation trend', free: false, pro: true, premium: true },
      { label: 'Hyperfocus detection', free: false, pro: true, premium: true },
      { label: 'Weekly pattern summary', free: false, pro: true, premium: true },
      { label: 'PDF export for a therapist', free: false, pro: true, premium: true },
    ],
  },
  {
    group: 'Acting on it',
    rows: [
      { label: 'Task breakdown assistant', free: false, pro: false, premium: true },
      { label: 'Weekly accountability check-in', free: false, pro: false, premium: true },
      { label: 'Strategy library for your triggers', free: false, pro: false, premium: true },
      { label: 'Monthly progress report', free: false, pro: false, premium: true },
      { label: 'Email support', free: 'Best effort', pro: 'Best effort', premium: '24 hours' },
    ],
  },
];

function Cell({ value }) {
  if (value === true) {
    return (
      <>
        <CheckIcon className="mx-auto h-4 w-4 text-accent-600" />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <span aria-hidden="true" className="text-gray-300">
          —
        </span>
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="text-xs text-gray-600">{value}</span>;
}

export default function PricingFAQ() {
  return (
    <InfoPage
      eyebrow="Plans & pricing"
      title="What each plan costs, and why"
      lede="Writing is free forever. The paid tiers exist because analysis costs us compute per entry — here’s the full comparison and the honest answers to the questions that follow."
      width="lg"
    >
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLANS.map((plan, i) => (
          <Card
            as="li"
            key={plan.name}
            tone={plan.featured ? 'brand' : 'default'}
            className={`fade-in stagger-item flex flex-col ${
              plan.featured ? 'ring-2 ring-brand-300' : ''
            }`}
            style={{ '--stagger-index': i }}
          >
            <h2 className="font-semibold text-gray-900">{plan.name}</h2>
            <p className="mt-1 text-sm text-gray-600">{plan.summary}</p>
            <p className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight text-gray-900">
                {plan.price}
              </span>
              <span className="text-sm text-gray-500">{plan.cadence}</span>
            </p>
            <Link
              to="/auth/signup"
              className={`mt-5 ${buttonClasses({
                variant: plan.featured ? 'primary' : 'secondary',
                fullWidth: true,
              })}`}
            >
              {plan.name === 'Free' ? 'Start writing free' : `Get ${plan.name}`}
            </Link>
          </Card>
        ))}
      </ul>

      <Section title="Side by side">
        {/* Scrolls horizontally rather than collapsing to stacked cards: a
            comparison you can't compare across defeats the point, and three
            columns of short values still fit at 375px. */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-card">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">Feature comparison of the Free, Pro, and Premium plans</caption>
            <thead>
              <tr className="border-b border-gray-200">
                <th scope="col" className="px-4 py-3 font-semibold text-gray-900 sm:px-5">
                  Feature
                </th>
                {PLANS.map((plan) => (
                  <th
                    key={plan.name}
                    scope="col"
                    className="w-24 px-3 py-3 text-center font-semibold text-gray-900"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            {MATRIX.map((section) => (
              <tbody key={section.group}>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th
                    scope="colgroup"
                    colSpan={4}
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-5"
                  >
                    {section.group}
                  </th>
                </tr>
                {section.rows.map((row) => (
                  <tr key={row.label} className="border-b border-gray-100 last:border-b-0">
                    <th scope="row" className="px-4 py-3 font-normal text-gray-700 sm:px-5">
                      {row.label}
                    </th>
                    <td className="px-3 py-3 text-center">
                      <Cell value={row.free} />
                    </td>
                    <td className="bg-brand-50/40 px-3 py-3 text-center">
                      <Cell value={row.pro} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Cell value={row.premium} />
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </Section>

      <Section title="Why we priced it this way">
        <div className="flex max-w-2xl flex-col gap-4">
          <Prose>
            Storing text is close to free, so writing is free — permanently, not as a trial. Running
            a model over every entry is not free, and it scales with how much you write rather than
            how many people sign up. Pro is priced against that cost with enough margin to keep the
            servers on.
          </Prose>
          <Prose>
            Premium is more than double because it’s more than double the work: breakdowns and
            check-ins are repeated back-and-forth rather than a single pass over an entry, and the
            support promise attached to it is a real commitment from a small team.
          </Prose>
          <Prose>
            We’d rather charge honestly for the expensive part than make everything free and quietly
            monetise your journal. Those are genuinely the two options, and the second one is how
            most free mental-health apps work.
          </Prose>
        </div>
      </Section>

      <Section title="The questions that usually follow">
        <Accordion className="max-w-3xl">
          <AccordionItem question="Why isn’t the analysis free?" defaultOpen>
            <p>
              Because it costs us money every time it runs, and that cost doesn’t go away at scale —
              it grows with it. A free analysis tier would have to be paid for somehow, and the usual
              answers are ads, data sales, or a venture-backed race to a much worse business model.
              Charging for the expensive feature is the version where your journal doesn’t become
              the product.
            </p>
          </AccordionItem>

          <AccordionItem question="Can I switch plans, and what happens when I do?">
            <p>
              Yes, both directions, from Settings. Upgrading applies immediately and Stripe prorates
              the difference, so you pay for what’s left of the current period rather than starting
              a new one. Downgrading or cancelling keeps you on the paid plan until the end of the
              period you’ve already paid for, then moves you to Free — nothing is deleted, and past
              analyses stay visible.
            </p>
          </AccordionItem>

          <AccordionItem question="Is there a free trial?">
            <p>
              Not in the usual sense, and deliberately. The free plan is unlimited and permanent, so
              you can find out whether writing here fits you before paying anything. What a trial
              would add is a countdown, and a countdown is exactly the kind of pressure this app is
              trying not to create. If you upgrade and it isn’t for you, see the refund answer below.
            </p>
          </AccordionItem>

          <AccordionItem question="What’s the refund policy?">
            <p>
              Email us within 14 days of any payment and we’ll refund it in full — no forms, no exit
              survey, no attempt to talk you out of it. After 14 days you can still cancel at any
              time; you keep access until the period you paid for runs out.
            </p>
          </AccordionItem>

          <AccordionItem question="Is this a substitute for therapy?">
            <p>
              No, and it’s worth being blunt about that. MindJournal describes patterns in text you
              wrote. It doesn’t diagnose, treat, or provide clinical advice, and it has no way of
              knowing when something you’ve written needs a professional rather than a chart.
            </p>
            <p className="mt-2">
              Where it does help is in the appointment you already have. Turning up with two months
              of dated, specific examples gets you further in fifty minutes than trying to summarise
              from memory. The PDF export exists precisely for that.
            </p>
          </AccordionItem>

          <AccordionItem question="What if I stop writing for a month?">
            <p>
              Nothing bad happens. There’s no streak to lose and no reactivation email. If you’re on
              a paid plan and genuinely not using it, cancel — you can resubscribe later and your
              history will still be there. We’d rather you paid for months you actually used.
            </p>
          </AccordionItem>

          <AccordionItem question="Do you offer a discount if I can’t afford it?">
            <p>
              Yes. Email us and say so — students, people out of work, and anyone for whom £9.99 is
              a real decision. There’s no means test and you won’t be asked to justify it. This is a
              small operation, so it isn’t unlimited, but it’s genuinely available.
            </p>
          </AccordionItem>
        </Accordion>
      </Section>

      <Section title="Still deciding?">
        <Card tone="brand" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Start on Free. Upgrade if it earns it.</h3>
            <p className="mt-1 text-sm text-gray-600">
              No card, no countdown. The analysis is still there when you want it.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link to="/auth/signup" className={buttonClasses()}>
              Start writing free
            </Link>
            <Link to="/faq" className={buttonClasses({ variant: 'secondary' })}>
              Read the FAQ
            </Link>
          </div>
        </Card>
      </Section>
    </InfoPage>
  );
}
