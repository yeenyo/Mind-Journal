import { selectStrategies } from './strategies.js';

// Shared by routes/insights.js (RLS-scoped, one user's own token) and
// scheduler.js (service-role client, run for every Premium user in a batch).
// Both need the exact same shape so the weekly digest a user gets by email
// matches what they'd see on /insights if they opened it that day — computing
// it twice would let the two drift silently apart.
//
// `supabase` is whichever client the caller already holds (RLS-scoped or
// service-role); this function only ever filters by `userId` explicitly, so it
// is correct either way — RLS narrows an already-correct query, it doesn't
// substitute for the userId filter.
export async function aggregateInsights(supabase, userId, { since, until } = {}) {
  let insightsQuery = supabase
    .from('insights')
    .select(
      `created_at, avoidance_triggers, time_blindness_indicators, emotional_detected,
       emotional_type, emotional_intensity, hyperfocus_detected, hyperfocus_topic,
       time_estimated, time_actual, time_difference, estimated_minutes, actual_minutes,
       actionable_suggestion`,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  let entriesQuery = supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (since) {
    insightsQuery = insightsQuery.gte('created_at', since);
    entriesQuery = entriesQuery.gte('created_at', since);
  }
  if (until) {
    insightsQuery = insightsQuery.lt('created_at', until);
    entriesQuery = entriesQuery.lt('created_at', until);
  }

  const [{ data: rows, error }, { count: totalEntries, error: countError }] = await Promise.all([
    insightsQuery,
    entriesQuery,
  ]);
  if (error) throw new Error(error.message);
  if (countError) throw new Error(countError.message);

  const triggerStats = new Map();
  const timeBlindness = [];
  const emotionalTrend = [];
  const hyperfocus = [];
  const timeEstimation = [];
  const suggestions = [];
  const emotionalTypes = [];

  for (const row of rows) {
    for (const trigger of row.avoidance_triggers ?? []) {
      const key = String(trigger).toLowerCase().trim();
      if (!key) continue;
      if (!triggerStats.has(key)) {
        triggerStats.set(key, { trigger: String(trigger).trim(), frequency: 0, firstSeen: row.created_at });
      }
      triggerStats.get(key).frequency += 1;
    }

    if ((row.time_blindness_indicators ?? []).length) {
      timeBlindness.push({ date: row.created_at, indicators: row.time_blindness_indicators });
    }

    if (row.emotional_detected && row.emotional_intensity != null) {
      emotionalTrend.push({
        date: row.created_at,
        intensity: row.emotional_intensity,
        type: row.emotional_type,
      });
      if (row.emotional_type) emotionalTypes.push(row.emotional_type);
    }

    if (row.hyperfocus_detected) {
      hyperfocus.push({ date: row.created_at, topic: row.hyperfocus_topic });
    }

    if (row.estimated_minutes != null && row.actual_minutes != null) {
      timeEstimation.push({
        date: row.created_at,
        estimated: row.time_estimated,
        actual: row.time_actual,
        estimatedMinutes: row.estimated_minutes,
        actualMinutes: row.actual_minutes,
        difference: row.time_difference,
      });
    }

    if (row.actionable_suggestion) {
      suggestions.push({ date: row.created_at, suggestion: row.actionable_suggestion });
    }
  }

  const avoidanceTriggers = [...triggerStats.values()].sort((a, b) => b.frequency - a.frequency);
  const totalEstimated = timeEstimation.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const totalActual = timeEstimation.reduce((sum, t) => sum + t.actualMinutes, 0);

  return {
    totalEntries,
    analysedEntries: rows.length,
    avoidanceTriggers,
    topTrigger: avoidanceTriggers[0]?.trigger ?? null,
    timeBlindness,
    emotionalTrend,
    hyperfocus,
    timeEstimation,
    timeTotals: {
      estimatedMinutes: totalEstimated,
      actualMinutes: totalActual,
      underestimatePct:
        totalEstimated > 0 ? Math.round(((totalActual - totalEstimated) / totalEstimated) * 100) : null,
    },
    suggestions: suggestions.slice(-5).reverse(),
    strategies: selectStrategies({
      avoidanceCount: avoidanceTriggers.reduce((sum, t) => sum + t.frequency, 0),
      timeBlindnessCount: timeBlindness.length,
      hyperfocusCount: hyperfocus.length,
      emotionalTypes,
    }),
  };
}
