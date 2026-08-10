import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';

import entriesRouter from './routes/entries.js';
import insightsRouter from './routes/insights.js';
import stripeRouter, { stripeWebhookHandler } from './routes/stripe.js';
import accountRouter from './routes/account.js';

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

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[server] unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`MindJournal API listening on :${PORT}`));
