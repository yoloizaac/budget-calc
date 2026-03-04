import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from '@/hooks/useCurrentUser';
import { parseSettingsMap, type Settings } from '@/lib/budget-utils';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<Settings> => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      return parseSettingsMap(data ?? []);
    },
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const user_id = await getCurrentUserId();
      const { error } = await supabase.from('settings').upsert(
        { key, value, user_id, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,key' }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}
