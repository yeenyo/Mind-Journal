import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[stripe] STRIPE_SECRET_KEY missing — billing routes will fail until set.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_placeholder');

export const PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_ID_PRO,
  premium: process.env.STRIPE_PRICE_ID_PREMIUM,
};
