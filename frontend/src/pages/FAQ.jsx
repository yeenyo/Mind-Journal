import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import InfoPage, { Prose } from '../components/InfoPage';
import Accordion, { AccordionItem } from '../components/Accordion';
import Card from '../components/Card';
import { SearchIcon } from '../components/Icons';

// Answers live as plain strings so the search below can match against them
// without walking a React tree. Anything needing a link gets a `link` field.
const CATEGORIES = [
  {
    id: 'adhd',
    heading: 'About ADHD',
    items: [
      {
        q: 'What is ADHD, in one paragraph?',
        a: 'A difference in how the brain regulates attention, motivation, and time. It isn’t a shortage of attention — it’s difficulty directing attention on demand, which is why you can lose six hours to something interesting and not start a ten-minute task you actually care about. It also affects working memory and time perception, which is the part most people underestimate.',
      },
      {
        q: 'How does journaling actually help with ADHD?',
        a: 'Mostly by working around memory. ADHD makes it hard to hold a week in your head, so you judge yourself on the last two hours instead of the last two months. Writing it down moves the record outside your head, where it can’t be quietly rewritten. The analysis then does the part almost nobody manages alone: going back and reading months of it honestly.',
      },
      {
        q: 'I lose track of time constantly. Is that ADHD or just me?',
        a: 'Time blindness — poor sense of how much time has passed and how long a thing will take — is one of the most consistently reported ADHD traits, and one of the least discussed. We can’t tell you whether it’s ADHD. We can show you the size of the gap between what you estimated and what it actually took, which is useful either way.',
      },
      {
        q: 'Do I need a diagnosis to use this?',
        a: 'No. Plenty of people use MindJournal while waiting on an assessment, or with no intention of getting one. The export exists partly because “I have eight weeks of written examples” is far more useful at an assessment than trying to recall specifics under pressure.',
      },
    ],
  },
  {
    id: 'product',
    heading: 'About MindJournal',
    items: [
      {
        q: 'What’s the catch with the free plan?',
        a: 'There isn’t one, in the sense you’re expecting. Writing and storing entries is free forever, unlimited, no card. What’s paid is the analysis — because running the model costs us money per entry. If you never upgrade, you still have a private journal that we don’t charge you for.',
      },
      {
        q: 'How long does the analysis take?',
        a: 'Usually a few seconds after you save. You land on the entry page and the patterns appear there. If the model is briefly unavailable your entry still saves — you never lose writing because analysis failed.',
      },
      {
        q: 'How many entries before the patterns mean anything?',
        a: 'Single entries give you that day. Trends need roughly two weeks of semi-regular writing before they say much — that’s not a limitation of the tool, it’s just how many data points a pattern needs. Five entries in one week beats one entry every week.',
      },
      {
        q: 'Can I write about things other than ADHD?',
        a: 'Yes, and you should. It works better the less you curate. Write about the argument, the deadline, the thing you did instead of the thing you meant to do. The analysis looks for specific patterns in whatever you give it, so filtering yourself first just removes the evidence.',
      },
      {
        q: 'What if the analysis gets something wrong?',
        a: 'It will, sometimes. It reads text, it doesn’t know you. Treat it as a prompt — “does this land?” — rather than a verdict. If it consistently misreads you, that’s worth telling us about.',
      },
    ],
  },
  {
    id: 'pricing',
    heading: 'Pricing',
    items: [
      {
        q: 'Why are there three tiers?',
        a: 'Free covers writing, which costs us almost nothing. Pro covers analysis, which costs us real compute per entry. Premium covers the ongoing back-and-forth — task breakdowns and weekly check-ins — which costs meaningfully more again. The tiers track our costs rather than an attempt to fence off features you’d otherwise get.',
        link: { to: '/pricing-faq', label: 'Full plan comparison' },
      },
      {
        q: 'Can I switch plans or cancel?',
        a: 'Any time, both directions, from Settings. Upgrades apply immediately and are prorated. Cancelling leaves you on the paid plan until the end of the period you already paid for, then drops you to Free — your entries and past analyses all stay.',
      },
      {
        q: 'Is there a refund if it’s not for me?',
        a: 'Yes — email us within 14 days of a payment and we’ll refund it, no interrogation. We’d rather give the money back than have someone paying monthly for something they stopped opening.',
      },
      {
        q: 'Do I lose my entries if I downgrade?',
        a: 'No. Entries are yours on every plan, including Free. Downgrading stops new analyses being generated; it doesn’t delete the ones you already have or lock you out of your writing.',
      },
    ],
  },
  {
    id: 'privacy',
    heading: 'Privacy',
    items: [
      {
        q: 'Where does my data actually go?',
        a: 'Entries are stored in our database, encrypted at rest. When an entry is analysed it goes to Anthropic’s Claude API for that one request — under terms that keep it out of model training — and nowhere else. It’s never sent to OpenAI, Google, or any other AI provider.',
        link: { to: '/privacy-and-terms', label: 'Read the privacy policy' },
      },
      {
        q: 'Can anyone at MindJournal read my journal?',
        a: 'Technically, a database administrator could — that’s true of every hosted service that isn’t end-to-end encrypted, and anyone claiming otherwise while offering server-side AI analysis is being loose with the truth. What we commit to: we don’t read entries, there’s no internal tool for browsing them, and we don’t use them for training, advertising, or anything else.',
      },
      {
        q: 'Do you sell my data?',
        a: 'No. Not to advertisers, data brokers, insurers, employers, or researchers. There is no anonymised-and-aggregated loophole here — we don’t sell it in any form.',
      },
      {
        q: 'Can I delete everything?',
        a: 'Yes, from Settings, and it deletes for real — entries, analyses, account. Export first if you want a copy, because we can’t undo it afterwards.',
      },
    ],
  },
  {
    id: 'technical',
    heading: 'Technical',
    items: [
      {
        q: 'Does it work offline?',
        a: 'Not properly, no. Drafts autosave to your browser as you type, so a dropped connection mid-entry doesn’t lose your writing, but saving and analysing both need you online.',
      },
      {
        q: 'What happens if the analysis server goes down?',
        a: 'Your entry still saves — that path doesn’t depend on the model. You’ll see a note saying the analysis didn’t run rather than a silent gap. We’d rather show you a failure than pretend an entry has nothing in it.',
      },
      {
        q: 'Is there a mobile app?',
        a: 'Not yet. The site is built mobile-first and works properly on a phone browser, including adding it to your home screen. A native app is on the list, below things that matter more.',
      },
      {
        q: 'Can I get my data out in a usable format?',
        a: 'Yes. CSV export for everything from Settings, and PDF export per entry or as a summary report if you’re taking it to a therapist or assessment.',
      },
    ],
  },
];

const ALL_ITEMS = CATEGORIES.flatMap((category) =>
  category.items.map((item) => ({ ...item, categoryId: category.id, heading: category.heading })),
);

export default function FAQ() {
  const [query, setQuery] = useState('');
  const trimmed = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!trimmed) return null;
    return ALL_ITEMS.filter(
      (item) =>
        item.q.toLowerCase().includes(trimmed) || item.a.toLowerCase().includes(trimmed),
    );
  }, [trimmed]);

  return (
    <InfoPage
      eyebrow="FAQ"
      title="Questions people actually ask"
      lede="Grouped by what you’re trying to find out. If something isn’t here, the answer is probably “email us and we’ll tell you”."
    >
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search questions…"
          aria-label="Search frequently asked questions"
          className="min-h-12 w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 text-gray-900 shadow-card transition-colors placeholder:text-gray-400 hover:border-gray-400 focus:border-brand-500"
        />
      </div>

      {matches ? (
        <div className="mt-8">
          <p className="text-sm text-gray-600" role="status" aria-live="polite">
            {matches.length === 0
              ? 'No questions match that.'
              : `${matches.length} ${matches.length === 1 ? 'question' : 'questions'} matching “${query.trim()}”`}
          </p>

          {matches.length === 0 ? (
            <Card className="fade-in mt-4">
              <Prose>
                Nothing here covers that one. Email{' '}
                <a
                  href="mailto:hello@mindjournal.app"
                  className="link-underline font-medium text-brand-700"
                >
                  hello@mindjournal.app
                </a>{' '}
                and you’ll get a real answer from a person, usually within a day.
              </Prose>
            </Card>
          ) : (
            <Accordion className="fade-in mt-4">
              {matches.map((item) => (
                <AccordionItem key={item.q} question={item.q} defaultOpen={matches.length <= 3}>
                  <p>{item.a}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-gray-400">
                    {item.heading}
                  </p>
                  {item.link && (
                    <Link
                      to={item.link.to}
                      className="link-underline mt-3 inline-block text-sm font-medium text-brand-700"
                    >
                      {item.link.label}
                    </Link>
                  )}
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-10">
          {CATEGORIES.map((category, i) => (
            <section
              key={category.id}
              id={category.id}
              className="fade-in stagger-item"
              style={{ '--stagger-index': i }}
            >
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                {category.heading}
              </h2>
              <Accordion className="mt-4">
                {category.items.map((item) => (
                  <AccordionItem key={item.q} question={item.q}>
                    <p>{item.a}</p>
                    {item.link && (
                      <Link
                        to={item.link.to}
                        className="link-underline mt-3 inline-block text-sm font-medium text-brand-700"
                      >
                        {item.link.label}
                      </Link>
                    )}
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      )}

      <Card tone="brand" className="mt-12">
        <h2 className="font-semibold text-gray-900">Still stuck on something?</h2>
        <Prose className="mt-1.5">
          Email{' '}
          <a href="mailto:hello@mindjournal.app" className="link-underline font-medium text-brand-700">
            hello@mindjournal.app
          </a>
          . A person reads it. Premium subscribers get a reply within 24 hours; everyone else,
          usually within a couple of days.
        </Prose>
      </Card>
    </InfoPage>
  );
}
