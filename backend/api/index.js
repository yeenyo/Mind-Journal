import app from '../src/app.js';

// Vercel's Node runtime treats any file under api/ that default-exports a
// function as a serverless function, and calls it as (req, res) per request —
// which is exactly an Express app's own calling convention. No adapter package,
// no rewrite of the routes: everything in src/routes keeps working unchanged.
//
// No app.listen() here and no startScheduler() — a serverless invocation
// exists only for the duration of one request, so a setInterval-style timer
// started inside it would never fire again after the response is sent. The
// scheduled jobs run instead via routes/cron.js, triggered by Vercel's own
// Cron Jobs feature (see /vercel.json) hitting an HTTP endpoint on schedule —
// that model works precisely because it doesn't depend on anything staying
// alive between requests.
export default app;
