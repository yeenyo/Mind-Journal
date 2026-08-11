import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';

import entriesRouter from './routes/entries.js';
import insightsRouter from './routes/insights.js';
import stripeRouter, { stripeWebhookHandler } from './routes/stripe.js';
import accountRouter from './routes/account.js';
import breakdownRouter from './routes/breakdown.js';
import emailRouter from './routes/email.js';
import schedulerRouter from './routes/scheduler.js';
import cronRouter from './routes/cron.js';

// Just the Express app — no app.listen() here. Split out from server.js so the
// same app can be handed to two different runtimes: server.js calls app.listen
// for local dev, and api/index.js (Vercel's serverless entry point) exports
// this directly, since Vercel's Node runtime accepts anything callable as
// `(req, res)` — which an Express app already is — with no adapter needed.
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));

// Stripe needs the raw body to verify webhook signatures, so this route
// is registered before the global express.json() body parser.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(express.json());

const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 60 });
app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/entries', entriesRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/account', accountRouter);
app.use('/api/breakdown', breakdownRouter);
app.use('/api/email', emailRouter);
app.use('/api/scheduler', schedulerRouter);
// Cron-triggered endpoints — see routes/cron.js. Separate from /api/scheduler
// because they're authenticated completely differently: a shared secret from
// Vercel's scheduler, not a logged-in user's bearer token.
app.use('/api/cron', cronRouter);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[server] unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

export default app;
