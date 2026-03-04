import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from '@/hooks/useCurrentUser';
import type { DailyLog } from '@/lib/budget-utils';

export interface DailyLogPhoto {
  id: string;
  daily_log_id: string;
  user_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
}

export function useDailyLogs() {
  return useQuery({
    queryKey: ['daily_log'],
    queryFn: async (): Promise<DailyLog[]> => {
      const { data, error } = await supabase.from('daily_log').select('*').order('date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as DailyLog[];
    },
  });
}

export function useDailyLogByDate(date: string) {
  return useQuery({
    queryKey: ['daily_log', date],
    queryFn: async (): Promise<DailyLog | null> => {
      const { data, error } = await supabase.from('daily_log').select('*').eq('date', date).maybeSingle();
      if (error) throw error;
      return data as DailyLog | null;
    },
    enabled: !!date,
  });
}

export function useUpsertDailyLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: Partial<Omit<DailyLog, 'updated_at'>> & { id?: string; date: string; country: string }) => {
      const user_id = await getCurrentUserId();
      const payload = { ...log, user_id, updated_at: new Date().toISOString() };
      if (log.id) {
        const { error } = await supabase.from('daily_log').update(payload as any).eq('id', log.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('daily_log').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily_log'] });
    },
  });
}

/** Upsert a single field on a daily log row */
export function useQuickSaveField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      date: string;
      country: string;
      field: string;
      value: number;
      existingId?: string;
    }) => {
      const user_id = await getCurrentUserId();
      const now = new Date().toISOString();
      if (params.existingId) {
        const { error } = await supabase
          .from('daily_log')
          .update({ [params.field]: params.value, updated_at: now })
          .eq('id', params.existingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('daily_log')
          .insert({
            date: params.date,
            country: params.country,
            user_id,
            [params.field]: params.value,
            updated_at: now,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily_log'] });
    },
  });
}

export function useDeleteDailyLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('daily_log').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily_log'] }),
  });
}

// ---- Photo hooks ----

export function useDailyLogPhotos(dailyLogId: string | undefined) {
  return useQuery({
    queryKey: ['daily_log_photos', dailyLogId],
    queryFn: async (): Promise<DailyLogPhoto[]> => {
      const { data, error } = await supabase
        .from('daily_log_photos')
        .select('*')
        .eq('daily_log_id', dailyLogId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as DailyLogPhoto[];
    },
    enabled: !!dailyLogId,
  });
}

export function useUploadDailyLogPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { dailyLogId: string; file: File; caption?: string }) => {
      const user_id = await getCurrentUserId();
      const ext = params.file.name.split('.').pop() || 'jpg';
      const path = `${user_id}/${params.dailyLogId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('daily-log-photos')
        .upload(path, params.file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('daily_log_photos')
        .insert({
          daily_log_id: params.dailyLogId,
          user_id,
          storage_path: path,
          caption: params.caption || null,
        });
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily_log_photos'] });
    },
  });
}

export function useDeleteDailyLogPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photo: DailyLogPhoto) => {
      await supabase.storage.from('daily-log-photos').remove([photo.storage_path]);
      const { error } = await supabase.from('daily_log_photos').delete().eq('id', photo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily_log_photos'] });
    },
  });
}

export function useUpdatePhotoCaption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; caption: string }) => {
      const { error } = await supabase
        .from('daily_log_photos')
        .update({ caption: params.caption })
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily_log_photos'] });
    },
  });
}

export async function getPhotoUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('daily-log-photos')
    .createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}
