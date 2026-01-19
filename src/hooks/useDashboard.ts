import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DashboardPeriodOptions {
  months?: number;
  startDate?: string;
  endDate?: string;
}

function generateMonthsList(options: DashboardPeriodOptions): { key: string; label: string }[] {
  const { months = 12, startDate: customStart, endDate: customEnd } = options;
  const monthsList: { key: string; label: string }[] = [];

  if (customStart && customEnd) {
    const start = parseISO(customStart);
    const end = parseISO(customEnd);
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    
    while (current <= endMonth) {
      monthsList.push({
        key: format(current, 'yyyy-MM'),
        label: format(current, 'MMM/yy', { locale: ptBR }),
      });
      current.setMonth(current.getMonth() + 1);
    }
  } else {
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      monthsList.push({
        key: format(date, 'yyyy-MM'),
        label: format(date, 'MMM/yy', { locale: ptBR }),
      });
    }
  }

  return monthsList;
}

function getStartDate(options: DashboardPeriodOptions): string {
  const { months = 12, startDate: customStart } = options;
  if (customStart) {
    return customStart;
  }
  return format(subMonths(new Date(), months - 1), 'yyyy-MM-01');
}

export function useDashboardMetrics(options: DashboardPeriodOptions = { months: 12 }) {
  const { months = 12, startDate: customStart, endDate: customEnd } = options;
  
  return useQuery({
    queryKey: ['dashboardMetrics', months, customStart, customEnd],
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

      // Batch fetch revenues for the selected period
      const startDateStr = getStartDate(options);
      let allRevenues: any[] = [];
      let revenuesPage = 0;
      let hasMoreRevenues = true;

      while (hasMoreRevenues) {
        const from = revenuesPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from('revenues')
          .select('date, our_share')
          .gte('date', startDateStr);
        
        if (customEnd) {
          query = query.lte('date', customEnd);
        }

        const { data: revenuesBatch } = await query.range(from, to);

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

      // Get current month revenue (or last month of the selected period)
      const currentMonth = customEnd 
        ? format(parseISO(customEnd), 'yyyy-MM') 
        : format(new Date(), 'yyyy-MM');
      const monthlyRevenue = revenues
        ?.filter(r => r.date.startsWith(currentMonth))
        .reduce((sum, r) => sum + Number(r.our_share), 0) || 0;

      // Get ALL contracts with batch fetching for the period
      let allContracts: any[] = [];
      let contractsPage = 0;
      let hasMoreContracts = true;

      while (hasMoreContracts) {
        const from = contractsPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from('contracts')
          .select('date, lots_traded, lots_zeroed')
          .gte('date', startDateStr);
        
        if (customEnd) {
          query = query.lte('date', customEnd);
        }

        const { data: contractsBatch } = await query.range(from, to);

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

export function useRevenueChart(options: DashboardPeriodOptions = { months: 12 }) {
  const { months = 12, startDate: customStart, endDate: customEnd } = options;
  
  return useQuery({
    queryKey: ['revenueChart', months, customStart, customEnd],
    queryFn: async () => {
      const startDateStr = getStartDate(options);
      const monthsList = generateMonthsList(options);
      
      const PAGE_SIZE = 1000;
      let allRevenues: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from('revenues')
          .select('date, our_share')
          .gte('date', startDateStr)
          .order('date');
        
        if (customEnd) {
          query = query.lte('date', customEnd);
        }

        const { data: revenuesBatch } = await query.range(from, to);

        if (revenuesBatch && revenuesBatch.length > 0) {
          allRevenues = [...allRevenues, ...revenuesBatch];
          hasMore = revenuesBatch.length === PAGE_SIZE;
          page++;
        } else {
          hasMore = false;
        }
      }

      // Group by month
      const byMonth: Record<string, number> = {};
      
      // Initialize months from the generated list
      monthsList.forEach(m => {
        byMonth[m.key] = 0;
      });

      allRevenues.forEach((r) => {
        const month = r.date.slice(0, 7);
        if (byMonth[month] !== undefined) {
          byMonth[month] += Number(r.our_share);
        }
      });

      return monthsList.map(m => ({
        month: m.label,
        value: byMonth[m.key] || 0,
      }));
    },
  });
}

export function useContractsChart(options: DashboardPeriodOptions = { months: 12 }) {
  const { months = 12, startDate: customStart, endDate: customEnd } = options;
  
  return useQuery({
    queryKey: ['contractsChart', months, customStart, customEnd],
    queryFn: async () => {
      const startDateStr = getStartDate(options);
      const monthsList = generateMonthsList(options);
      
      // Batch fetch ALL contracts for the period
      const PAGE_SIZE = 1000;
      let allContracts: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from('contracts')
          .select('date, lots_traded, lots_zeroed')
          .gte('date', startDateStr);
        
        if (customEnd) {
          query = query.lte('date', customEnd);
        }

        const { data: contractsBatch } = await query.range(from, to);

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
      
      // Initialize months from the generated list
      monthsList.forEach(m => {
        byMonth[m.key] = { traded: 0, zeroed: 0 };
      });

      allContracts.forEach((c) => {
        const month = c.date.slice(0, 7);
        if (byMonth[month]) {
          byMonth[month].traded += c.lots_traded;
          byMonth[month].zeroed += c.lots_zeroed;
        }
      });

      return monthsList.map(m => ({
        month: m.label,
        girados: byMonth[m.key]?.traded || 0,
        zerados: byMonth[m.key]?.zeroed || 0,
      }));
    },
  });
}

export function useClientsChart(options: DashboardPeriodOptions = { months: 12 }) {
  const { months = 12, startDate: customStart, endDate: customEnd } = options;
  
  return useQuery({
    queryKey: ['clientsChart', months, customStart, customEnd],
    queryFn: async () => {
      const startDateStr = getStartDate(options);
      const monthsList = generateMonthsList(options);
      
      const PAGE_SIZE = 1000;
      let allRevenues: any[] = [];
      let page = 0;
      let hasMore = true;

      // Fetch revenues to determine active clients (clients that generated revenue)
      while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from('revenues')
          .select('date, client_id')
          .gte('date', startDateStr)
          .order('date');
        
        if (customEnd) {
          query = query.lte('date', customEnd);
        }

        const { data: revenuesBatch } = await query.range(from, to);

        if (revenuesBatch && revenuesBatch.length > 0) {
          allRevenues = [...allRevenues, ...revenuesBatch];
          hasMore = revenuesBatch.length === PAGE_SIZE;
          page++;
        } else {
          hasMore = false;
        }
      }

      // Group by month - count unique clients that generated revenue
      const byMonth: Record<string, Set<string>> = {};
      
      // Initialize months from the generated list
      monthsList.forEach(m => {
        byMonth[m.key] = new Set();
      });

      allRevenues.forEach((r) => {
        if (!r.client_id) return;
        const month = r.date.slice(0, 7);
        if (byMonth[month]) {
          byMonth[month].add(r.client_id);
        }
      });

      return monthsList.map(m => ({
        month: m.label,
        clientes: byMonth[m.key]?.size || 0,
      }));
    },
  });
}
