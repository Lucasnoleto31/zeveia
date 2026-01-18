import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PartnerCommission {
  id: string;
  partner_id: string;
  amount: number;
  reference_month: string;
  payment_date: string | null;
  status: 'pending' | 'paid' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function usePartnerCommissions(partnerId: string | null) {
  return useQuery({
    queryKey: ['partnerCommissions', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      
      const { data, error } = await supabase
        .from('partner_commissions')
        .select('*')
        .eq('partner_id', partnerId)
        .order('reference_month', { ascending: false });

      if (error) throw error;
      return data as PartnerCommission[];
    },
    enabled: !!partnerId,
  });
}

export function useCreatePartnerCommission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commission: Omit<PartnerCommission, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('partner_commissions')
        .insert(commission)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['partnerCommissions', variables.partner_id] });
    },
  });
}

export function useUpdatePartnerCommission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...commission }: Partial<PartnerCommission> & { id: string }) => {
      const { data, error } = await supabase
        .from('partner_commissions')
        .update(commission)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['partnerCommissions', data.partner_id] });
    },
  });
}

export function useDeletePartnerCommission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, partnerId }: { id: string; partnerId: string }) => {
      const { error } = await supabase
        .from('partner_commissions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return partnerId;
    },
    onSuccess: (partnerId) => {
      queryClient.invalidateQueries({ queryKey: ['partnerCommissions', partnerId] });
    },
  });
}
