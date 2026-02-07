import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardPeriodOptions {
  months?: number;
  startDate?: string;
  endDate?: string;
}

function rpcParams(options: DashboardPeriodOptions) {
  const params: Record<string, any> = {};
  if (options.months && options.months !== 12) params.p_months = options.months;
  if (options.startDate) params.p_start_date = options.startDate;
  if (options.endDate) params.p_end_date = options.endDate;
  return params;
}

export function useDashboardMetrics(options: DashboardPeriodOptions = { months: 12 }) {
  const { months = 12, startDate, endDate } = options;

  return useQuery({
    queryKey: ['dashboardMetrics', months, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_metrics', rpcParams(options));
      if (error) throw error;
      const d = data as any;
      return {
        totalClients: Number(d.totalClients) || 0,
        totalClientsPF: Number(d.totalClientsPF) || 0,
        totalClientsPJ: Number(d.totalClientsPJ) || 0,
        totalLeads: Number(d.totalLeads) || 0,
        leadsByStatus: d.leadsByStatus || { novo: 0, em_contato: 0, troca_assessoria: 0, convertido: 0, perdido: 0 },
        totalRevenue: Number(d.totalRevenue) || 0,
        monthlyRevenue: Number(d.monthlyRevenue) || 0,
        totalLotsTraded: Number(d.totalLotsTraded) || 0,
        totalLotsZeroed: Number(d.totalLotsZeroed) || 0,
      };
    },
  });
}

export function useRevenueChart(options: DashboardPeriodOptions = { months: 12 }) {
  const { months = 12, startDate, endDate } = options;

  return useQuery({
    queryKey: ['revenueChart', months, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_revenue_chart', rpcParams(options));
      if (error) throw error;
      return (data as any[]).map((d: any) => ({
        month: d.month,
        value: Number(d.value) || 0,
      }));
    },
  });
}

export function useContractsChart(options: DashboardPeriodOptions = { months: 12 }) {
  const { months = 12, startDate, endDate } = options;

  return useQuery({
    queryKey: ['contractsChart', months, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_contracts_chart', rpcParams(options));
      if (error) throw error;
      return (data as any[]).map((d: any) => ({
        month: d.month,
        girados: Number(d.girados) || 0,
        zerados: Number(d.zerados) || 0,
      }));
    },
  });
}

export function useClientsChart(options: DashboardPeriodOptions = { months: 12 }) {
  const { months = 12, startDate, endDate } = options;

  return useQuery({
    queryKey: ['clientsChart', months, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_clients_chart', rpcParams(options));
      if (error) throw error;
      return (data as any[]).map((d: any) => ({
        month: d.month,
        clientes: Number(d.clientes) || 0,
      }));
    },
  });
}
