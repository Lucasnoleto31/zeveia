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

// Batch fetch all account mappings to overcome 1000 record limit
async function fetchAllAccountMappings(): Promise<AccountMapping[]> {
  const PAGE_SIZE = 1000;
  let allData: AccountMapping[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('client_account_mappings')
      .select('*')
      .range(from, to);

    if (error) throw error;

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      hasMore = data.length === PAGE_SIZE;
      page++;
    } else {
      hasMore = false;
    }
  }

  return allData;
}

export function useAccountMappings() {
  return useQuery({
    queryKey: ['accountMappings'],
    queryFn: async (): Promise<AccountMapping[]> => fetchAllAccountMappings(),
  });
}
