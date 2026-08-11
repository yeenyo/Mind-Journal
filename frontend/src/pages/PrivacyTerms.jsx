import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import InfoPage, { Prose, Section } from '../components/InfoPage';
import Card from '../components/Card';
import { LockIcon, ScaleIcon } from '../components/Icons';

const LAST_UPDATED = '11 August 2026';

const TABS = [
  { id: 'privacy', label: 'Privacy policy', icon: LockIcon },
  { id: 'terms', label: 'Terms of service', icon: ScaleIcon },
];

function Clause({ heading, children }) {
  return (
    <section className="mt-8 first:mt-0">
      <h3 className="font-semibold text-gray-900">{heading}</h3>
      <div className="mt-2 flex flex-col gap-3">{children}</div>
    </section>
  );
}

export default function PrivacyTerms() {
  const { hash } = useLocation();
  // Footer links straight to #terms, so the hash picks the tab rather than
  // scrolling to an anchor that's hidden inside the other panel.
  const [tab, setTab] = useState(hash === '#terms' ? 'terms' : 'privacy');

  useEffect(() => {
    if (hash === '#terms') setTab('terms');
    if (hash === '#privacy') setTab('privacy');
  }, [hash]);

  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy and terms"
      lede="Written to be read, not to be survived. If any part of this is unclear, that’s our failure — email us and we’ll fix the wording."
    >
      <Card tone="brand" className="flex items-start gap-3">
        <LockIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        <p className="text-[15px] font-medium leading-relaxed text-gray-800">
          Your journal entries are for you. We just help you understand them.
        </p>
      </Card>

      <div className="mt-8 border-b border-gray-200">
        <div role="tablist" aria-label="Legal documents" className="-mb-px flex gap-1">
          {TABS.map(({ id, label, icon: TabIcon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              onClick={() => setTab(id)}
              className={`press -mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                tab === id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500">Last updated {LAST_UPDATED}.</p>

      {tab === 'privacy' ? (
        <div
          key="privacy"
          role="tabpanel"
          id="panel-privacy"
          aria-labelledby="tab-privacy"
          className="fade-in mt-6"
        >
          <Section title="Privacy policy">
            <Clause heading="What we collect">
              <Prose>
                Your email address, a hashed password, your journal entries, and the analyses
                generated from them. If you subscribe, Stripe holds your payment details and we hold
                only a customer reference and your plan status — we never see your card number.
              </Prose>
              <Prose>
                We also keep basic technical logs (timestamps, error traces) for a short period so we
                can tell when something is broken. Those don’t contain entry text.
              </Prose>
            </Clause>

            <Clause heading="Where your entries are analysed">
              <Prose>
                By Anthropic’s Claude API. Your entry text is sent to Anthropic for the sole purpose of
                generating your analysis, under their standard API terms — which commit that data sent
                through the API is not used to train their models. It is not sent to OpenAI, Google, or
                any other AI provider, and Anthropic does not have standing access to your account or
                your other entries; each request only carries the one entry being analysed.
              </Prose>
              <Prose>
                This is also most of what the paid plans cost you for: each analysis is a metered API
                call, not a one-off infrastructure cost we absorb.
              </Prose>
            </Clause>

            <Clause heading="How it’s stored">
              <Prose>
                Entries are encrypted in transit (TLS) and at rest in our database. Access is limited
                to the small number of people who operate the infrastructure.
              </Prose>
              <Prose>
                To be straight with you about a thing many apps fudge: this is not end-to-end
                encryption. A server-side model has to be able to read an entry in order to analyse
                it, so anyone claiming both server-side AI and true end-to-end encryption is
                overselling. What we commit to instead is policy: we do not read your entries, there
                is no internal tool for browsing them, and nobody is looking at your journal.
              </Prose>
            </Clause>

            <Clause heading="What we never do">
              <Prose>
                We do not sell your data — not to advertisers, data brokers, insurers, employers, or
                researchers, in identified or aggregated form. We do not use your entries to train
                models. We do not show you ads. We do not share your writing with anyone outside the
                service.
              </Prose>
            </Clause>

            <Clause heading="Who else touches your data">
              <Prose>
                Only the infrastructure we need to run: our database and authentication provider, our
                hosting provider, and Stripe for payments. Each is bound by its own data processing
                terms, and none of them receives your entries for their own purposes.
              </Prose>
            </Clause>

            <Clause heading="Your rights">
              <Prose>
                Export everything as a CSV at any time from Settings. Delete your account from the
                same place — that removes your entries, analyses, and account for real, and we can’t
                recover it afterwards, so export first if you want a copy.
              </Prose>
              <Prose>
                If you’re in the UK or EU, you also have the usual GDPR rights — access, correction,
                erasure, portability, and objection. Email us and we’ll action it within 30 days,
                usually much sooner.
              </Prose>
            </Clause>

            <Clause heading="Retention">
              <Prose>
                Entries stay until you delete them or your account. Deleted content is removed from
                live systems immediately and cycles out of encrypted backups within 30 days. Technical
                logs are kept for 30 days.
              </Prose>
            </Clause>

            <Clause heading="Cookies">
              <Prose>
                A session cookie to keep you logged in, and nothing else. No analytics cookies, no
                advertising trackers, no third-party pixels — which is why you’ve never seen a consent
                banner here.
              </Prose>
            </Clause>

            <Clause heading="Children">
              <Prose>
                MindJournal is for people aged 16 and over. We don’t knowingly collect data from
                anyone younger; if we learn we have, we delete it.
              </Prose>
            </Clause>

            <Clause heading="Changes and contact">
              <Prose>
                If we change anything material we’ll email you before it takes effect, not
                afterwards. Questions, requests, or complaints:{' '}
                <a
                  href="mailto:privacy@mindjournal.app"
                  className="link-underline font-medium text-brand-700"
                >
                  privacy@mindjournal.app
                </a>
                .
              </Prose>
            </Clause>
          </Section>
        </div>
      ) : (
        <div
          key="terms"
          role="tabpanel"
          id="panel-terms"
          aria-labelledby="tab-terms"
          className="fade-in mt-6"
        >
          <Section title="Terms of service">
            <Clause heading="The short version">
              <Prose>
                Use MindJournal to keep a journal and understand your own patterns. Don’t use it to
                harm anyone or to break the service for other people. We’ll do our best to keep it
                running and your data safe, but it’s a journaling tool, not a medical service.
              </Prose>
            </Clause>

            <Clause heading="Your account">
              <Prose>
                You need to be 16 or older. Keep your password to yourself — you’re responsible for
                activity under your account. One account per person; don’t share a login with someone
                whose journal shouldn’t be mixed with yours.
              </Prose>
            </Clause>

            <Clause heading="What you write stays yours">
              <Prose>
                You own your entries. We claim no rights over them beyond the narrow permission
                needed to run the service: store them, display them back to you, and process them
                through our own analysis model at your request. That permission ends when you delete
                the content.
              </Prose>
            </Clause>

            <Clause heading="Acceptable use">
              <Prose>
                Don’t use MindJournal to store or distribute unlawful content, to attack or overload
                the service, to reverse engineer it, or to resell access. We may suspend accounts
                doing any of those, and we’ll tell you why.
              </Prose>
            </Clause>

            <Clause heading="Not medical advice">
              <Prose>
                This is the clause that matters most, so it’s in plain terms: MindJournal is not a
                medical device, not a diagnostic tool, and not a substitute for professional care. Its
                analysis describes patterns in text you wrote. It cannot diagnose ADHD or anything
                else, and it can be wrong.
              </Prose>
              <Prose>
                Never delay seeking professional help because of something this app did or didn’t
                say. If you’re in crisis, contact your local emergency services or a crisis line —
                in the UK, Samaritans on 116 123; in the US, call or text 988.
              </Prose>
            </Clause>

            <Clause heading="Payment, renewal, and cancellation">
              <Prose>
                Paid plans bill monthly through Stripe and renew automatically until cancelled. Cancel
                any time from Settings; you keep access until the end of the period you’ve paid for,
                and you won’t be charged again. Upgrades are prorated.
              </Prose>
              <Prose>
                We refund any payment if you ask within 14 days of it being taken. If we ever change
                prices, existing subscribers get at least 30 days’ notice by email.
              </Prose>
            </Clause>

            <Clause heading="Availability">
              <Prose>
                We aim to keep MindJournal up and working, but we don’t promise uninterrupted service.
                Maintenance, outages, and occasional analysis failures happen. When analysis fails,
                your entry still saves — we consider losing your writing a much more serious failure
                than a missing chart.
              </Prose>
            </Clause>

            <Clause heading="Limitation of liability">
              <Prose>
                To the extent the law allows, we’re not liable for indirect or consequential losses,
                or for decisions you make based on the analysis. Our total liability is limited to
                what you paid us in the twelve months before the claim. Nothing here limits liability
                for death, personal injury caused by negligence, or fraud — the law doesn’t permit
                that, and we wouldn’t want it to.
              </Prose>
            </Clause>

            <Clause heading="Ending it">
              <Prose>
                You can delete your account whenever you like, and it takes effect immediately. We may
                close an account for a serious or repeated breach of these terms, with notice and an
                opportunity to export your data unless the law requires otherwise.
              </Prose>
            </Clause>

            <Clause heading="Governing law and contact">
              <Prose>
                These terms are governed by the laws of England and Wales. Questions:{' '}
                <a
                  href="mailto:hello@mindjournal.app"
                  className="link-underline font-medium text-brand-700"
                >
                  hello@mindjournal.app
                </a>
                .
              </Prose>
            </Clause>
          </Section>
        </div>
      )}
    </InfoPage>
  );
}
