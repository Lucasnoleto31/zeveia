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

      // Batch fetch ALL leads
      const PAGE_SIZE = 1000;
      let allLeads: any[] = [];
      let leadsPage = 0;
      let hasMoreLeads = true;

      while (hasMoreLeads) {
        const from = leadsPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data: leadsBatch } = await supabase
          .from('leads')
          .select('status')
          .range(from, to);

        if (leadsBatch && leadsBatch.length > 0) {
          allLeads = [...allLeads, ...leadsBatch];
          hasMoreLeads = leadsBatch.length === PAGE_SIZE;
          leadsPage++;
        } else {
          hasMoreLeads = false;
        }
      }

      const leadsByStatus = {
        novo: 0,
        em_contato: 0,
        troca_assessoria: 0,
        convertido: 0,
        perdido: 0,
      };

      allLeads.forEach((lead: any) => {
        if (lead.status in leadsByStatus) {
          leadsByStatus[lead.status as keyof typeof leadsByStatus]++;
        }
      });

      const totalLeads = Object.values(leadsByStatus).reduce((a, b) => a + b, 0) - leadsByStatus.convertido - leadsByStatus.perdido;

      // Batch fetch ALL revenues
      let allRevenues: any[] = [];
      let revenuesPage = 0;
      let hasMoreRevenues = true;

      while (hasMoreRevenues) {
        const from = revenuesPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data: revenuesBatch } = await supabase
          .from('revenues')
          .select('date, our_share')
          .range(from, to);

        if (revenuesBatch && revenuesBatch.length > 0) {
          allRevenues = [...allRevenues, ...revenuesBatch];
          hasMoreRevenues = revenuesBatch.length === PAGE_SIZE;
          revenuesPage++;
        } else {
          hasMoreRevenues = false;
        }
      }

      const revenues = allRevenues;

      const totalRevenue = revenues?.reduce((sum, r) => sum + Number(r.our_share), 0) || 0;

      const currentMonth = format(new Date(), 'yyyy-MM');
      const monthlyRevenue = revenues
        ?.filter(r => r.date.startsWith(currentMonth))
        .reduce((sum, r) => sum + Number(r.our_share), 0) || 0;

      // Get ALL contracts with batch fetching
      let allContracts: any[] = [];
      let contractsPage = 0;
      let hasMoreContracts = true;

      while (hasMoreContracts) {
        const from = contractsPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data: contractsBatch } = await supabase
          .from('contracts')
          .select('date, lots_traded, lots_zeroed')
          .range(from, to);

        if (contractsBatch && contractsBatch.length > 0) {
          allContracts = [...allContracts, ...contractsBatch];
          hasMoreContracts = contractsBatch.length === PAGE_SIZE;
          contractsPage++;
        } else {
          hasMoreContracts = false;
        }
      }

      const totalLotsTraded = allContracts.reduce((sum, c) => sum + c.lots_traded, 0);
      const totalLotsZeroed = allContracts.reduce((sum, c) => sum + c.lots_zeroed, 0);

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
      const startDate = format(subMonths(new Date(), 11), 'yyyy-MM-01');
      const PAGE_SIZE = 1000;
      let allRevenues: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data: revenuesBatch } = await supabase
          .from('revenues')
          .select('date, our_share')
          .gte('date', startDate)
          .order('date')
          .range(from, to);

        if (revenuesBatch && revenuesBatch.length > 0) {
          allRevenues = [...allRevenues, ...revenuesBatch];
          hasMore = revenuesBatch.length === PAGE_SIZE;
          page++;
        } else {
          hasMore = false;
        }
      }

      const revenues = allRevenues;

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
      const startDate = format(subMonths(new Date(), 11), 'yyyy-MM-01');
      
      // Batch fetch ALL contracts for the period
      const PAGE_SIZE = 1000;
      let allContracts: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data: contractsBatch } = await supabase
          .from('contracts')
          .select('date, lots_traded, lots_zeroed')
          .gte('date', startDate)
          .range(from, to);

        if (contractsBatch && contractsBatch.length > 0) {
          allContracts = [...allContracts, ...contractsBatch];
          hasMore = contractsBatch.length === PAGE_SIZE;
          page++;
        } else {
          hasMore = false;
        }
      }

      // Group by month
      const byMonth: Record<string, { traded: number; zeroed: number }> = {};
      
      // Initialize last 12 months
      for (let i = 11; i >= 0; i--) {
        const month = format(subMonths(new Date(), i), 'yyyy-MM');
        byMonth[month] = { traded: 0, zeroed: 0 };
      }

      allContracts.forEach((c) => {
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
      const startDate = format(subMonths(new Date(), 11), 'yyyy-MM-01');
      const PAGE_SIZE = 1000;
      let allClients: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data: clientsBatch } = await supabase
          .from('clients')
          .select('created_at')
          .eq('active', true)
          .gte('created_at', startDate)
          .order('created_at')
          .range(from, to);

        if (clientsBatch && clientsBatch.length > 0) {
          allClients = [...allClients, ...clientsBatch];
          hasMore = clientsBatch.length === PAGE_SIZE;
          page++;
        } else {
          hasMore = false;
        }
      }

      const clients = allClients;

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
