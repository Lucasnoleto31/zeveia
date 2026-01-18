import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: async () => {
      // Get clients count
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      const { count: totalClientsPF } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)
        .eq('type', 'pf');

      const { count: totalClientsPJ } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)
        .eq('type', 'pj');

      // Get leads count by status
      const { data: leadsData } = await supabase
        .from('leads')
        .select('status');

      const leadsByStatus = {
        novo: 0,
        em_contato: 0,
        troca_assessoria: 0,
        convertido: 0,
        perdido: 0,
      };

      leadsData?.forEach((lead: any) => {
        if (lead.status in leadsByStatus) {
          leadsByStatus[lead.status as keyof typeof leadsByStatus]++;
        }
      });

      const totalLeads = Object.values(leadsByStatus).reduce((a, b) => a + b, 0) - leadsByStatus.convertido - leadsByStatus.perdido;

      // Get revenues
      const { data: revenues } = await supabase
        .from('revenues')
        .select('date, our_share');

      const totalRevenue = revenues?.reduce((sum, r) => sum + Number(r.our_share), 0) || 0;

      const currentMonth = format(new Date(), 'yyyy-MM');
      const monthlyRevenue = revenues
        ?.filter(r => r.date.startsWith(currentMonth))
        .reduce((sum, r) => sum + Number(r.our_share), 0) || 0;

      // Get contracts
      const { data: contracts } = await supabase
        .from('contracts')
        .select('date, lots_traded, lots_zeroed');

      const totalLotsTraded = contracts?.reduce((sum, c) => sum + c.lots_traded, 0) || 0;
      const totalLotsZeroed = contracts?.reduce((sum, c) => sum + c.lots_zeroed, 0) || 0;

      return {
        totalClients: totalClients || 0,
        totalClientsPF: totalClientsPF || 0,
        totalClientsPJ: totalClientsPJ || 0,
        totalLeads,
        leadsByStatus,
        totalRevenue,
        monthlyRevenue,
        totalLotsTraded,
        totalLotsZeroed,
      };
    },
  });
}

export function useRevenueChart() {
  return useQuery({
    queryKey: ['revenueChart'],
    queryFn: async () => {
      const { data: revenues } = await supabase
        .from('revenues')
        .select('date, our_share')
        .gte('date', format(subMonths(new Date(), 11), 'yyyy-MM-01'))
        .order('date');

      // Group by month
      const byMonth: Record<string, number> = {};
      
      // Initialize last 12 months
      for (let i = 11; i >= 0; i--) {
        const month = format(subMonths(new Date(), i), 'yyyy-MM');
        byMonth[month] = 0;
      }

      revenues?.forEach((r) => {
        const month = r.date.slice(0, 7);
        if (byMonth[month] !== undefined) {
          byMonth[month] += Number(r.our_share);
        }
      });

      return Object.entries(byMonth).map(([month, value]) => ({
        month: format(new Date(month + '-01'), 'MMM/yy', { locale: ptBR }),
        value,
      }));
    },
  });
}

export function useContractsChart() {
  return useQuery({
    queryKey: ['contractsChart'],
    queryFn: async () => {
      const { data: contracts } = await supabase
        .from('contracts')
        .select('date, lots_traded, lots_zeroed')
        .gte('date', format(subMonths(new Date(), 11), 'yyyy-MM-01'))
        .order('date');

      // Group by month
      const byMonth: Record<string, { traded: number; zeroed: number }> = {};
      
      // Initialize last 12 months
      for (let i = 11; i >= 0; i--) {
        const month = format(subMonths(new Date(), i), 'yyyy-MM');
        byMonth[month] = { traded: 0, zeroed: 0 };
      }

      contracts?.forEach((c) => {
        const month = c.date.slice(0, 7);
        if (byMonth[month]) {
          byMonth[month].traded += c.lots_traded;
          byMonth[month].zeroed += c.lots_zeroed;
        }
      });

      return Object.entries(byMonth).map(([month, data]) => ({
        month: format(new Date(month + '-01'), 'MMM/yy', { locale: ptBR }),
        girados: data.traded,
        zerados: data.zeroed,
      }));
    },
  });
}

export function useClientsChart() {
  return useQuery({
    queryKey: ['clientsChart'],
    queryFn: async () => {
      const { data: clients } = await supabase
        .from('clients')
        .select('created_at')
        .eq('active', true)
        .gte('created_at', format(subMonths(new Date(), 11), 'yyyy-MM-01'))
        .order('created_at');

      // Group by month (cumulative)
      const byMonth: Record<string, number> = {};
      
      // Initialize last 12 months
      for (let i = 11; i >= 0; i--) {
        const month = format(subMonths(new Date(), i), 'yyyy-MM');
        byMonth[month] = 0;
      }

      clients?.forEach((c) => {
        const month = c.created_at.slice(0, 7);
        if (byMonth[month] !== undefined) {
          byMonth[month]++;
        }
      });

      // Make it cumulative
      let cumulative = 0;
      return Object.entries(byMonth).map(([month, count]) => {
        cumulative += count;
        return {
          month: format(new Date(month + '-01'), 'MMM/yy', { locale: ptBR }),
          clientes: cumulative,
        };
      });
    },
  });
}
