import { supabase } from '@/integrations/supabase/client';

interface BatchFetchOptions {
  pageSize?: number;
}

type FilterFn = (query: any) => any;

/**
 * Generic batch fetch utility to overcome the Supabase 1000-row limit.
 * Fetches all records from a table by paginating through results.
 *
 * @param table - The Supabase table name
 * @param select - The select fields (supports relations)
 * @param applyFilters - Optional function to apply filters to the query
 * @param options - Optional configuration (pageSize)
 * @returns Array of all matching records
 *
 * @example
 * // Simple fetch
 * const clients = await batchFetch('clients', '*');
 *
 * // With relations and filters
 * const revenues = await batchFetch(
 *   'revenues',
 *   '*, product:products(*), client:clients(*)',
 *   (query) => query.eq('client_id', clientId).gte('date', startDate)
 * );
 */
export async function batchFetch<T = any>(
  table: string,
  select: string = '*',
  applyFilters?: FilterFn,
  options?: BatchFetchOptions
): Promise<T[]> {
  const PAGE_SIZE = options?.pageSize || 1000;
  let allData: T[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from(table)
      .select(select)
      .range(from, to);

    if (applyFilters) {
      query = applyFilters(query);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (data && data.length > 0) {
      allData = [...allData, ...(data as T[])];
      hasMore = data.length === PAGE_SIZE;
      page++;
    } else {
      hasMore = false;
    }
  }

  return allData;
}

/**
 * Batch fetch records filtered by a specific column value.
 * Convenience wrapper around batchFetch for the common pattern of
 * fetching all records for a specific entity (e.g., all revenues for a client).
 *
 * @param table - The Supabase table name
 * @param select - The select fields
 * @param filterColumn - Column name to filter by
 * @param filterValue - Value to filter for
 * @param additionalFilters - Optional additional filters
 * @returns Array of all matching records
 */
export async function batchFetchByColumn<T = any>(
  table: string,
  select: string,
  filterColumn: string,
  filterValue: string,
  additionalFilters?: FilterFn
): Promise<T[]> {
  return batchFetch<T>(
    table,
    select,
    (query) => {
      let filtered = query.eq(filterColumn, filterValue);
      if (additionalFilters) {
        filtered = additionalFilters(filtered);
      }
      return filtered;
    }
  );
}
