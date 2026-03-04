import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

const FX_RATE_KEYS = [
  { currency: 'THB', settingKey: 'fx_rate_thb', decimals: 2 },
  { currency: 'VND', settingKey: 'fx_rate_vnd', decimals: 0 },
  { currency: 'CNY', settingKey: 'fx_rate_cny', decimals: 2 },
  { currency: 'MYR', settingKey: 'fx_rate_myr', decimals: 2 },
  { currency: 'IDR', settingKey: 'fx_rate_idr', decimals: 0 },
  { currency: 'INR', settingKey: 'fx_rate_inr', decimals: 2 },
  { currency: 'USD', settingKey: 'fx_rate_usd', decimals: 4 },
  { currency: 'EUR', settingKey: 'fx_rate_eur', decimals: 4 },
];

async function seedDefaultSettings(userId: string) {
  try {
    const defaults = [
      { key: 'display_country', value: 'Singapore', user_id: userId, updated_at: new Date().toISOString() },
      { key: 'display_currency', value: 'SGD', user_id: userId, updated_at: new Date().toISOString() },
    ];
    // Only insert if not existing (onConflict ignore)
    await supabase.from('settings' as any).upsert(defaults as any, { onConflict: 'user_id,key', ignoreDuplicates: true });
    console.log('[useAuth] Default settings seeded for new user');
  } catch (err) {
    console.warn('[useAuth] Failed to seed defaults:', err);
  }
}

async function trackActivity(userId: string, email: string) {
  try {
    // Try insert first, if conflict then update
    const { error } = await supabase.from('user_activity' as any).upsert({
      user_id: userId,
      user_email: email,
      last_active_at: new Date().toISOString(),
    } as any, { onConflict: 'user_id' });
    console.log('[useAuth] Activity tracked', error ? error.message : 'ok');
  } catch (err) {
    console.warn('[useAuth] Failed to track activity:', err);
  }
}

async function fetchAndSaveRates(userId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-fx-rates');
    if (error) throw error;
    const rates = data?.rates;
    if (!rates) return;

    const upserts = FX_RATE_KEYS.flatMap(({ currency, settingKey, decimals }) => {
      const rate = rates[currency];
      if (!rate) return [];
      const val = String(parseFloat(rate).toFixed(decimals));
      const row = { key: settingKey, value: val, user_id: userId, updated_at: new Date().toISOString() };
      const rows = [row];
      // Also sync legacy fx_rate for THB
      if (currency === 'THB') {
        rows.push({ key: 'fx_rate', value: val, user_id: userId, updated_at: new Date().toISOString() });
      }
      return rows;
    });

    if (upserts.length > 0) {
      await supabase.from('settings' as any).upsert(upserts as any, { onConflict: 'user_id,key' });
    }
    console.log('[useAuth] FX rates auto-updated on login');
  } catch (err) {
    console.warn('[useAuth] Failed to auto-fetch FX rates:', err);
  }
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialised = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!initialised.current && event === 'INITIAL_SESSION') {
          initialised.current = true;
        }
        if (initialised.current) {
          setSession(session);
          setLoading(false);
        }

        // Auto-fetch FX rates on login/signup AND on page load with existing session
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user?.id) {
          // Use setTimeout to avoid blocking auth state update
          setTimeout(async () => {
            seedDefaultSettings(session.user.id);
            fetchAndSaveRates(session.user.id);
            trackActivity(session.user.id, session.user.email || '');
            // Seed onboarding_completed = 'pending' only if it doesn't exist yet
            try {
              const { data } = await supabase.from('settings' as any)
                .select('value')
                .eq('user_id', session.user.id)
                .eq('key', 'onboarding_completed')
                .maybeSingle();
              if (!data) {
                await supabase.from('settings' as any).insert({
                  key: 'onboarding_completed',
                  value: 'pending',
                  user_id: session.user.id,
                  updated_at: new Date().toISOString(),
                } as any);
                console.log('[useAuth] Seeded onboarding_completed=pending for new user');
              }
            } catch (err) {
              console.warn('[useAuth] Failed to seed onboarding flag:', err);
            }
          }, 0);
        }
      }
    );

    const timeout = setTimeout(() => {
      if (!initialised.current) {
        initialised.current = true;
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setLoading(false);
        });
      }
    }, 2000);

    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { session, loading, signOut };
}
