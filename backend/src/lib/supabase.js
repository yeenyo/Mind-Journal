import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing — set them in backend/.env before hitting any API route.'
  );
}

// Service-role client: used for operations that must bypass RLS
// (Stripe webhooks with no user session, tier-limit checks).
export const supabaseAdmin = createClient(
  SUPABASE_URL || 'http://localhost',
  SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Per-request client scoped to the caller's JWT so Postgres RLS applies.
export function supabaseForToken(accessToken) {
  return createClient(SUPABASE_URL || 'http://localhost', process.env.SUPABASE_ANON_KEY || 'placeholder', {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
