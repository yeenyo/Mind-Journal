import InfoPage, { Prose, Section } from '../components/InfoPage';
import Accordion, { AccordionItem } from '../components/Accordion';
import Card from '../components/Card';
import { ExternalLinkIcon } from '../components/Icons';

const ARTICLES = [
  {
    title: 'Why ADHD people lose track of time',
    readingTime: '2 min',
    paragraphs: [
      'Time blindness isn’t carelessness. The working theory is that ADHD affects the internal sense of duration — the background process that quietly tells most people “that was about twenty minutes”. Without it, time is only measurable by checking, and checking requires remembering to check.',
      'This is why “I’ll just do this for five minutes” turns into ninety, and why a task you know takes an hour still feels like it might fit in the fifteen minutes before you leave. Neither is a planning failure. Both are what happens when duration has to be calculated deliberately instead of felt.',
      'The workaround isn’t trying harder to sense time — it’s externalising it. Visible clocks, timers you can see counting down rather than ones that just go off, and a written record of how long things actually took last time. That last one is the whole reason this app tracks estimate versus reality.',
    ],
  },
  {
    title: 'Task avoidance is not laziness',
    readingTime: '2 min',
    paragraphs: [
      'The tasks you avoid are rarely the hardest ones. They’re the ones with an unclear first step, an ambiguous finish line, or an emotional charge attached — a reply you’re dreading, a form where you don’t know what one of the boxes means, a project someone will judge.',
      'Lazy would mean not wanting to do it. What actually happens is wanting to do it, thinking about it constantly, feeling worse each hour it stays undone, and still not starting. That’s a lot of effort. It’s just effort that produces nothing, which is why it doesn’t feel like effort from the inside.',
      'The useful question isn’t “why am I like this”. It’s “what specifically is unclear about starting this?” Nine times out of ten the answer is a missing first step, and naming it dissolves most of the resistance.',
    ],
  },
  {
    title: 'How to journal when you have ADHD',
    readingTime: '3 min',
    paragraphs: [
      'Most journaling advice is written by people for whom journaling already works. Daily habit, same time each day, keep it up for months. If that were achievable, the advice would be unnecessary.',
      'What works better: drop the streak entirely. Write when something happened worth recording, even if that’s twice a week. A journal with gaps is still a journal; a journal you abandoned in week two because you missed a day is not.',
      'Write badly on purpose. Fragments, no punctuation, swearing, whatever. The moment it becomes a thing you have to do properly, it joins the pile of tasks with an unclear standard — and you already know what happens to those.',
      'Record the boring specifics, not the feelings summary. “Meant to start the report at 10, actually started at 3, kept opening my email instead” is worth ten entries of “bad day, felt unproductive”. The specifics are what patterns are made of.',
      'And write near the end of the day rather than the start. Morning entries are predictions; evening entries are evidence.',
    ],
  },
  {
    title: 'Hyperfocus: the hidden superpower (with a catch)',
    readingTime: '2 min',
    paragraphs: [
      'Hyperfocus is the flip side of attention dysregulation. When the subject is interesting enough, attention locks on completely — hours vanish, hunger goes unnoticed, and the quality of work can be genuinely exceptional.',
      'The catch is that you don’t choose the subject and you don’t choose the exit. Hyperfocus on the thing that was due today is a superpower. Hyperfocus on reorganising your music library at 2am the night before is the same mechanism producing the opposite result.',
      'Rather than trying to summon it, it’s worth tracking what preceded it. Most people find a handful of reliable conditions — a specific kind of task, time of day, or a deadline at a particular distance. Those are schedulable, even when the state itself isn’t.',
    ],
  },
  {
    title: 'Why your estimates are always wrong (and how to fix them)',
    readingTime: '2 min',
    paragraphs: [
      'Everyone underestimates task length — it’s called the planning fallacy and it’s near-universal. ADHD widens the gap considerably, because the estimate is generated from a best-case memory of a similar task rather than from any felt sense of duration.',
      'Trying to estimate better by thinking harder doesn’t work; the input is the problem, not the effort. What does work is estimating from your own recorded history: not “this feels like an hour” but “the last three times I did something like this it took two and a half”.',
      'A rough multiplier is a reasonable start. Track a few weeks of estimate versus actual, find your personal ratio, and apply it. Most people land somewhere between 1.5× and 3×, and are unsettled by how consistent their own number turns out to be.',
    ],
  },
  {
    title: 'Rejection sensitivity, in plain terms',
    readingTime: '2 min',
    paragraphs: [
      'A lot of people with ADHD describe an outsized, physical reaction to criticism, rejection, or even the suspicion of it — a short message from a manager, a friend who takes a day to reply. It’s not a formal diagnosis, but it shows up often enough in first-person accounts to be worth naming.',
      'The unhelpful part isn’t the feeling itself; it’s the decisions it prompts in the following hour. Sending the long apologetic message, withdrawing from a project, rewriting something that was fine.',
      'Writing it down at the time — what happened, what you assumed it meant, how intense it felt on a scale of one to ten — gives you something to compare against a week later, when you can see how the assumption actually played out. Over enough entries, the gap between the feeling and the outcome becomes hard to argue with.',
    ],
  },
  {
    title: 'Body doubling, and why it works',
    readingTime: '1 min',
    paragraphs: [
      'Working alongside another person — in the room, on a video call, silently, doing entirely unrelated things — makes starting easier for a lot of ADHD people. Nobody is fully sure why. The most common explanation is that another person’s presence supplies a bit of external structure that internal motivation isn’t currently providing.',
      'It’s worth trying before dismissing, because it costs nothing and the effect is often disproportionate to how silly it sounds. A friend on a call with their camera on and their microphone muted is a complete implementation.',
    ],
  },
  {
    title: 'What to bring to an ADHD assessment',
    readingTime: '2 min',
    paragraphs: [
      'Assessments lean heavily on retrospective self-report, which is a difficult thing to ask of someone whose working memory is part of what’s being assessed. Turning up with written examples changes the conversation.',
      'Useful things to bring: concrete incidents with dates, evidence from childhood if you can get it (school reports are gold), and specifics about how it affects work and relationships now. Vague self-description tends to get vague results.',
      'If you’ve been journaling, export a summary and take it. “Here are eleven dated examples of the same avoidance pattern over two months” is a substantially stronger starting point than trying to recall specifics under pressure in an unfamiliar room.',
    ],
  },
];

const EXTERNAL = [
  {
    name: 'r/ADHD',
    url: 'https://www.reddit.com/r/ADHD/',
    body: 'The largest general ADHD community. Best for realising a specific experience isn’t just you. Its wiki is unusually good on medication and diagnosis basics.',
  },
  {
    name: 'r/ADHDwomen',
    url: 'https://www.reddit.com/r/adhdwomen/',
    body: 'Focused on the presentations that get missed or misdiagnosed for years — inattentive traits, late diagnosis, and how hormones interact with symptoms.',
  },
  {
    name: 'CHADD',
    url: 'https://chadd.org/',
    body: 'US non-profit with evidence-based explainers on diagnosis, treatment, and accommodations. Drier than the forums, and more reliable when the stakes are high.',
  },
  {
    name: 'ADDitude Magazine',
    url: 'https://www.additudemag.com/',
    body: 'Long-running publication covering research, strategies, and first-person accounts. Skim past the product recommendations for the clinical explainers.',
  },
  {
    name: 'ADHD UK',
    url: 'https://adhduk.co.uk/',
    body: 'Practical guidance on the UK route specifically — NHS waiting lists, Right to Choose, and what to expect from an assessment.',
  },
];

export default function Resources() {
  return (
    <InfoPage
      eyebrow="Resources"
      title="Short things worth knowing"
      lede="Not a blog. Eight pieces that come up often enough in support conversations that they’re worth writing down once, plus the outside communities we’d actually point someone to."
    >
      <Section
        title="Reading"
        hint="Tap a title to open it. Nothing here is longer than three minutes."
      >
        <Accordion>
          {ARTICLES.map((article) => (
            <AccordionItem
              key={article.title}
              question={
                <>
                  {article.title}
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    {article.readingTime}
                  </span>
                </>
              }
            >
              <div className="flex flex-col gap-3">
                {article.paragraphs.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      <Section
        title="Communities and organisations"
        hint="Places we’d send a friend. We aren’t affiliated with any of them."
      >
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {EXTERNAL.map((resource, i) => (
            <Card
              as="li"
              key={resource.name}
              interactive
              className="fade-in stagger-item"
              style={{ '--stagger-index': i }}
            >
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="icon-tilt-parent group flex items-start justify-between gap-3"
              >
                <span>
                  <span className="font-semibold text-gray-900 group-hover:text-brand-700">
                    {resource.name}
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-gray-600">
                    {resource.body}
                  </span>
                </span>
                <ExternalLinkIcon className="icon-tilt mt-0.5 h-4 w-4 shrink-0 text-gray-400 group-hover:text-brand-600" />
              </a>
            </Card>
          ))}
        </ul>
      </Section>

      <Section title="If you’re struggling right now">
        <Card tone="danger">
          <Prose>
            None of this is a substitute for professional help, and an app is the wrong tool for a
            crisis. If you’re in immediate danger or thinking about harming yourself, contact your
            local emergency services or a crisis line — in the UK, Samaritans on 116 123, free, any
            hour. In the US, call or text 988.
          </Prose>
        </Card>
      </Section>
    </InfoPage>
  );
}
