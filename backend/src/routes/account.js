import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();
router.use(requireAuth);

function toCsv(entries) {
  const header = 'id,created_at,word_count,content\n';
  const rows = entries.map((e) => {
    const escaped = e.content.replace(/"/g, '""');
    return `${e.id},${e.created_at},${e.word_count},"${escaped}"`;
  });
  return header + rows.join('\n');
}

router.get('/export', async (req, res) => {
  const { data, error } = await req.supabase
    .from('entries')
    .select('id, content, word_count, created_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="mindjournal-export.csv"');
  res.send(toCsv(data));
});

router.delete('/', async (req, res) => {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
