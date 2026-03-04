import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from '@/hooks/useCurrentUser';
import type { Transaction } from '@/lib/budget-utils';

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
  });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx: Partial<Omit<Transaction, 'id' | 'created_at'>>) => {
      const user_id = await getCurrentUserId();
      const { error } = await supabase.from('transactions').insert({ ...tx, user_id } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...tx }: Partial<Transaction> & { id: string }) => {
      const { error } = await supabase.from('transactions').update(tx).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}
