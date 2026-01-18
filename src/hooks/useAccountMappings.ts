import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AccountMapping {
  id: string;
  client_id: string;
  account_number: string;
  original_client_name: string | null;
  merged_at: string | null;
  created_at: string | null;
}

export function useAccountMappings() {
  return useQuery({
    queryKey: ['accountMappings'],
    queryFn: async (): Promise<AccountMapping[]> => {
      const { data, error } = await supabase
        .from('client_account_mappings')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });
}
