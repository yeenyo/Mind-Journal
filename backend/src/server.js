import app from './app.js';
import { startScheduler } from './scheduler.js';

// Local-dev / any-persistent-host entry point. Not used on Vercel — see
// api/index.js there instead. The two matter for different reasons:
// node-cron in this file needs an always-running process to fire on schedule,
// which is exactly what a serverless platform doesn't give you; running this
// file is how the scheduler actually works if MindJournal is ever hosted
// somewhere with a real persistent process instead (a VM, Fly.io, etc).
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MindJournal API listening on :${PORT}`);
  startScheduler();
});
