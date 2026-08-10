import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { stripe, PRICE_IDS } from '../lib/stripe.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

router.post('/checkout-session', requireAuth, async (req, res) => {
  const { plan } = req.body;
  const priceId = PRICE_IDS[plan];

  if (!priceId) {
    return res.status(400).json({ error: 'plan must be "pro" or "premium".' });
  }

  const { data: profile, error } = await req.supabase
    .from('users')
    .select('stripe_customer_id, email')
    .eq('id', req.user.id)
    .single();
  if (error) return res.status(500).json({ error: error.message });

  let customerId = profile.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: req.user.email,
      metadata: { supabase_user_id: req.user.id },
    });
    customerId = customer.id;
    await req.supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', req.user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.FRONTEND_URL}/settings`,
    metadata: { supabase_user_id: req.user.id, plan },
  });

  res.json({ url: session.url });
});

router.post('/cancel-subscription', requireAuth, async (req, res) => {
  const { data: profile, error } = await req.supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', req.user.id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  if (!profile.stripe_customer_id) {
    return res.status(400).json({ error: 'No active subscription.' });
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: profile.stripe_customer_id,
    status: 'active',
    limit: 1,
  });

  if (!subscriptions.data.length) {
    return res.status(400).json({ error: 'No active subscription.' });
  }

  await stripe.subscriptions.update(subscriptions.data[0].id, { cancel_at_period_end: true });
  res.json({ status: 'cancel_scheduled' });
});

// Exported standalone (not attached to `router`) because it must be mounted
// with express.raw() in server.js, before the global express.json() parser —
// Stripe requires the raw body to verify the webhook signature.
export async function stripeWebhookHandler(req, res) {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe] webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.supabase_user_id;
      const plan = session.metadata?.plan;
      if (userId && plan) {
        await supabaseAdmin.from('users').update({ subscription_tier: plan }).eq('id', userId);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await supabaseAdmin
        .from('users')
        .update({ subscription_tier: 'free' })
        .eq('stripe_customer_id', subscription.customer);
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
}

export default router;
