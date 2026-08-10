# MindJournal

AI-powered journaling app. React/Vite/Tailwind frontend, Express backend,
Supabase (Postgres + Auth), Claude API for entry analysis, Stripe billing.

## Structure

```
frontend/   Vite + React 18 + TailwindCSS
backend/    Node + Express API
supabase/   schema.sql — run in the Supabase SQL editor
```

## Setup

1. **Supabase**: create a project, run `supabase/schema.sql` in the SQL
   editor. Copy the project URL, anon key, and service role key.
2. **Anthropic**: get an API key from console.anthropic.com.
3. **Stripe**: get test-mode secret/publishable keys, create two recurring
   Prices (Pro $12/mo, Premium $29/mo), and a webhook endpoint pointing at
   `<backend-url>/api/stripe/webhook` for `checkout.session.completed` and
   `customer.subscription.deleted` (copy the signing secret).
4. Copy `backend/.env.example` → `backend/.env` and
   `frontend/.env.example` → `frontend/.env`, fill in the values above.
5. `cd backend && npm install && npm run dev` (http://localhost:3001)
6. `cd frontend && npm install && npm run dev` (http://localhost:5173)

## Deployment

- **Frontend**: push to GitHub, connect the repo to Vercel (root directory
  `frontend`), set the `VITE_*` env vars, auto-deploys on push.
- **Backend**: push to GitHub, connect to Railway or Render (root directory
  `backend`), set the same env vars as `.env`, including `FRONTEND_URL`
  pointed at the deployed Vercel URL.
- **Database**: already provisioned via Supabase; no extra deploy step.

## Notes

- Row Level Security is enabled on every table — users can only read/write
  their own rows.
- Claude analysis is rate-limited to one call per user per 5 minutes
  (in-memory; move to a DB-backed check if the backend scales to multiple
  instances).
- Free tier is capped at 3 entries, enforced server-side in
  `backend/src/routes/entries.js`.
