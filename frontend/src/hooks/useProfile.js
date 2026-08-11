import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// Subscription tier lives in public.users and is read by both the dashboard
// badge and the settings page, so the fetch is shared here.
export function useProfile() {
  const { user } = useAuth();
  const [tier, setTier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    if (queryError) setError(queryError.message);
    else setError('');
    setTier(data?.subscription_tier ?? 'free');
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return { tier, loading, error, refresh: load };
}
