import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

const RANGE_DAYS = { '7d': 7, '30d': 30, all: null };

router.get('/', async (req, res) => {
  const range = RANGE_DAYS[req.query.range] !== undefined ? req.query.range : '30d';
  const days = RANGE_DAYS[range];

  const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString() : null;

  let insightsQuery = req.supabase
    .from('insights')
    .select('themes, analysis_text, created_at')
    .order('created_at', { ascending: true });
  let entriesQuery = req.supabase.from('entries').select('id', { count: 'exact', head: true });

  if (since) {
    insightsQuery = insightsQuery.gte('created_at', since);
    entriesQuery = entriesQuery.gte('created_at', since);
  }

  const [{ data, error }, { count: totalEntries, error: countError }] = await Promise.all([
    insightsQuery,
    entriesQuery,
  ]);
  if (error) return res.status(500).json({ error: error.message });
  if (countError) return res.status(500).json({ error: countError.message });

  const themeStats = new Map();
  for (const row of data) {
    for (const theme of row.themes ?? []) {
      const key = theme.toLowerCase();
      if (!themeStats.has(key)) {
        themeStats.set(key, { theme, frequency: 0, firstSeen: row.created_at });
      }
      themeStats.get(key).frequency += 1;
    }
  }

  const themes = [...themeStats.values()].sort((a, b) => b.frequency - a.frequency);

  res.json({
    range,
    totalEntries,
    mostCommonTheme: themes[0]?.theme ?? null,
    themes,
  });
});

export default router;
