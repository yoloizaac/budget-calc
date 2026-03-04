import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from '@/hooks/useCurrentUser';
import type { RentPayment } from '@/lib/budget-utils';

export function useRentPayments() {
  return useQuery({
    queryKey: ['rent_payments'],
    queryFn: async (): Promise<RentPayment[]> => {
      const { data, error } = await supabase.from('rent_payments').select('*').order('due_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as RentPayment[];
    },
  });
}

export function useMarkRentPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paid_date, payment_method, notes }: { id: string; paid_date: string; payment_method?: string; notes?: string }) => {
      const { error } = await supabase.from('rent_payments').update({
        is_paid: true, paid_date, payment_method: payment_method ?? null, notes: notes ?? null
      }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, paid_date, payment_method }) => {
      await qc.cancelQueries({ queryKey: ['rent_payments'] });
      const prev = qc.getQueryData<RentPayment[]>(['rent_payments']);
      qc.setQueryData<RentPayment[]>(['rent_payments'], old =>
        old?.map(r => r.id === id ? { ...r, is_paid: true, paid_date, payment_method } : r) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['rent_payments'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['rent_payments'] }),
  });
}

export function useUpdateRentPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RentPayment> & { id: string }) => {
      const { error } = await supabase.from('rent_payments').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rent_payments'] }),
  });
}

export function useAddRentPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rent: Omit<RentPayment, 'id'>) => {
      const user_id = await getCurrentUserId();
      const { error } = await supabase.from('rent_payments').insert({ ...rent, user_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rent_payments'] }),
  });
}

export function useDeleteRentPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rent_payments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rent_payments'] }),
  });
}
