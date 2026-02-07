import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types matching the database schema
export type MacroEventType = 
  | 'fomc' | 'copom' | 'payroll' | 'cpi' | 'ipca' 
  | 'pib' | 'earnings' | 'options_expiry' | 'contract_rollover' | 'other';

export type ImpactLevel = 'high' | 'medium' | 'low';

export interface MacroEvent {
  id: string;
  name: string;
  event_type: MacroEventType;
  event_date: string;
  description: string | null;
  impact_level: ImpactLevel;
  country: string;
  recurring: boolean;
  created_at: string;
}

export interface MacroEventFilters {
  eventType?: MacroEventType;
  impactLevel?: ImpactLevel;
  country?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Event type display config
export const EVENT_TYPE_CONFIG: Record<MacroEventType, { label: string; color: string; emoji: string }> = {
  fomc: { label: 'FOMC', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', emoji: '🇺🇸' },
  copom: { label: 'Copom', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', emoji: '🇧🇷' },
  payroll: { label: 'Payroll', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', emoji: '📊' },
  cpi: { label: 'CPI', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', emoji: '📈' },
  ipca: { label: 'IPCA', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', emoji: '📉' },
  pib: { label: 'PIB', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200', emoji: '🏦' },
  earnings: { label: 'Balanço', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', emoji: '💰' },
  options_expiry: { label: 'Venc. Opções', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', emoji: '⏰' },
  contract_rollover: { label: 'Rolagem', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200', emoji: '🔄' },
  other: { label: 'Outro', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', emoji: '📌' },
};

export const IMPACT_CONFIG: Record<ImpactLevel, { label: string; color: string }> = {
  high: { label: 'Alto', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  medium: { label: 'Médio', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  low: { label: 'Baixo', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
};

// Fetch macro events with filters
export function useMacroEvents(filters?: MacroEventFilters) {
  return useQuery({
    queryKey: ['macro-events', filters],
    queryFn: async () => {
      let query = supabase
        .from('macro_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (filters?.eventType) {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters?.impactLevel) {
        query = query.eq('impact_level', filters.impactLevel);
      }

      if (filters?.country) {
        query = query.eq('country', filters.country);
      }

      if (filters?.startDate) {
        query = query.gte('event_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('event_date', filters.endDate);
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as MacroEvent[];
    },
  });
}

// Fetch upcoming events (next N days)
export function useUpcomingMacroEvents(days: number = 7) {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);

  const startDate = today.toISOString().split('T')[0];
  const endDate = futureDate.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['macro-events', 'upcoming', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('macro_events')
        .select('*')
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .order('event_date', { ascending: true });

      if (error) throw error;
      return (data || []) as MacroEvent[];
    },
  });
}

// Fetch single event
export function useMacroEvent(id: string) {
  return useQuery({
    queryKey: ['macro-events', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('macro_events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as MacroEvent;
    },
    enabled: !!id,
  });
}

// Create macro event
export function useCreateMacroEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: Omit<MacroEvent, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('macro_events')
        .insert(event)
        .select()
        .single();

      if (error) throw error;
      return data as MacroEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['macro-events'] });
    },
  });
}

// Update macro event
export function useUpdateMacroEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...event }: Partial<MacroEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from('macro_events')
        .update(event)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as MacroEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['macro-events'] });
    },
  });
}

// Delete macro event
export function useDeleteMacroEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('macro_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['macro-events'] });
    },
  });
}
