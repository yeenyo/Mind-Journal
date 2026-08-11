import app from './app.js';
import { startScheduler } from './scheduler.js';

// This file is now ALSO the entrypoint Vercel's "Services" runtime detects
// (vercel.json's backend.entrypoint) — its Node.js docs specifically look for
// a file that calls .listen(), which ruled out the plain-export api/index.js
// pattern used for classic serverless functions. Whether that runtime keeps
// the process genuinely persistent between requests, or Vercel just wants
// something shaped like a real server, isn't something the docs make explicit
// either way — and node-cron only works under the first of those.
//
// Rather than bet on it, startScheduler() is skipped whenever VERCEL is set
// (a variable Vercel injects into every build/runtime automatically). The
// real scheduling on Vercel goes through routes/cron.js, triggered by
// Vercel's own Cron Jobs feature — that mechanism is documented, and doesn't
// care whether the process between requests is alive or not. Running both
// would mean every scheduled email risks going out twice.
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MindJournal API listening on :${PORT}`);
  if (!process.env.VERCEL) {
    startScheduler();
  } else {
    console.log('[server] Running on Vercel — scheduler runs via /api/cron/*, not in-process.');
  }
});
