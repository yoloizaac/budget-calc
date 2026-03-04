import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from '@/hooks/useCurrentUser';
import type { Funding } from '@/lib/budget-utils';

export function useFunding() {
  return useQuery({
    queryKey: ['funding'],
    queryFn: async (): Promise<Funding[]> => {
      const { data, error } = await supabase.from('funding').select('*').order('date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Funding[];
    },
  });
}

export function useAddFunding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: Partial<Omit<Funding, 'id'>>) => {
      const user_id = await getCurrentUserId();
      const { error } = await supabase.from('funding').insert({ ...f, user_id } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funding'] }),
  });
}

export function useUpdateFunding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...f }: Partial<Funding> & { id: string }) => {
      const { error } = await supabase.from('funding').update(f).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funding'] }),
  });
}

export function useDeleteFunding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('funding').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funding'] }),
  });
}

export function useToggleFundingReceived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_received }: { id: string; is_received: boolean }) => {
      const { error } = await supabase.from('funding').update({ is_received }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, is_received }) => {
      await qc.cancelQueries({ queryKey: ['funding'] });
      const prev = qc.getQueryData<Funding[]>(['funding']);
      qc.setQueryData<Funding[]>(['funding'], old =>
        old?.map(f => f.id === id ? { ...f, is_received } : f) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['funding'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['funding'] }),
  });
}
