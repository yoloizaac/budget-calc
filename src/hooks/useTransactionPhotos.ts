import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from '@/hooks/useCurrentUser';

export interface TransactionPhoto {
  id: string;
  transaction_id: string;
  user_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
}

export function useTransactionPhotos(transactionId: string | undefined) {
  return useQuery({
    queryKey: ['transaction-photos', transactionId],
    enabled: !!transactionId,
    queryFn: async (): Promise<TransactionPhoto[]> => {
      const { data, error } = await supabase
        .from('transaction_photos')
        .select('*')
        .eq('transaction_id', transactionId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TransactionPhoto[];
    },
  });
}

export function useUploadTransactionPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ transactionId, file }: { transactionId: string; file: File }) => {
      const userId = await getCurrentUserId();
      const path = `${userId}/tx-${transactionId}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('daily-log-photos').upload(path, file);
      if (uploadErr) throw uploadErr;
      const { error: dbErr } = await supabase.from('transaction_photos').insert({
        transaction_id: transactionId,
        user_id: userId,
        storage_path: path,
      } as any);
      if (dbErr) throw dbErr;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['transaction-photos', vars.transactionId] }),
  });
}

export function useDeleteTransactionPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photo: TransactionPhoto) => {
      await supabase.storage.from('daily-log-photos').remove([photo.storage_path]);
      const { error } = await supabase.from('transaction_photos').delete().eq('id', photo.id);
      if (error) throw error;
    },
    onSuccess: (_d, photo) => qc.invalidateQueries({ queryKey: ['transaction-photos', photo.transaction_id] }),
  });
}

export function useUpdateTransactionPhotoCaption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, caption }: { id: string; caption: string }) => {
      const { error } = await supabase.from('transaction_photos').update({ caption } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transaction-photos'] }),
  });
}
