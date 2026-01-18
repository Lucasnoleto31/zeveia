import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from 'date-fns';

export interface AssessorPerformance {
  id: string;
  name: string;
  totalClients: number;
  newClients: number;
  totalLeads: number;
  convertedLeads: number;
  lostLeads: number;
  conversionRate: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalPatrimony: number;
  avgTicket: number;
  lotsTraded: number;
  ranking: number;
  score: number;
}

export interface PerformanceMetrics {
  assessors: AssessorPerformance[];
  totals: {
    clients: number;
    newClients: number;
    leads: number;
    convertedLeads: number;
    revenue: number;
    patrimony: number;
    lotsTraded: number;
  };
  evolution: {
    month: string;
    assessorId: string;
    assessorName: string;
    revenue: number;
    clients: number;
  }[];
  topPerformers: {
    revenue: AssessorPerformance | null;
    conversion: AssessorPerformance | null;
    clients: AssessorPerformance | null;
  };
}

export interface PerformanceReportOptions {
  months?: number;
  startDate?: string;
  endDate?: string;
}

export function usePerformanceReport(options: PerformanceReportOptions | number = 6) {
  const opts = typeof options === 'number' ? { months: options } : options;
  const { months = 6, startDate: customStartDate, endDate: customEndDate } = opts;

  return useQuery({
    queryKey: ['performance-report', months, customStartDate, customEndDate],
    queryFn: async (): Promise<PerformanceMetrics> => {
      let startDateISO: string;
      let endDateISO: string;

      if (customStartDate && customEndDate) {
        startDateISO = new Date(customStartDate).toISOString();
        endDateISO = new Date(customEndDate + 'T23:59:59').toISOString();
      } else {
        const endDate = endOfMonth(new Date());
        const startDate = startOfMonth(subMonths(new Date(), months - 1));
        startDateISO = startDate.toISOString();
        endDateISO = endDate.toISOString();
      }
      const currentMonthStart = startOfMonth(new Date());

      // Get all assessors (profiles with user_roles)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name');

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const assessorIds = userRoles?.map(r => r.user_id) || [];
      const profilesMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      // Get clients per assessor
      const { data: clients } = await supabase
        .from('clients')
        .select('id, assessor_id, created_at, patrimony, active')
        .in('assessor_id', assessorIds);

      // Get leads per assessor
      const { data: leads } = await supabase
        .from('leads')
        .select('id, assessor_id, status, created_at')
        .in('assessor_id', assessorIds)
        .gte('created_at', startDateISO);

      // Get revenues per client (to calculate by assessor)
      const { data: revenues } = await supabase
        .from('revenues')
        .select('client_id, our_share, date');

      // Get contracts
      const { data: contracts } = await supabase
        .from('contracts')
        .select('client_id, lots_traded, date');

      // Create client to assessor mapping
      const clientAssessorMap = new Map(clients?.map(c => [c.id, c.assessor_id]) || []);

      // Calculate metrics per assessor
      const assessorMetrics: Map<string, AssessorPerformance> = new Map();

      assessorIds.forEach(assessorId => {
        const name = profilesMap.get(assessorId) || 'Desconhecido';
        
        // Clients
        const assessorClients = clients?.filter(c => c.assessor_id === assessorId && c.active) || [];
        const startDateObj = new Date(startDateISO);
        const newClients = clients?.filter(c => 
          c.assessor_id === assessorId && 
          c.active &&
          new Date(c.created_at) >= startDateObj
        ) || [];
        
        // Leads
        const assessorLeads = leads?.filter(l => l.assessor_id === assessorId) || [];
        const convertedLeads = assessorLeads.filter(l => l.status === 'convertido').length;
        const lostLeads = assessorLeads.filter(l => l.status === 'perdido').length;
        const activeLeads = assessorLeads.length - lostLeads;
        
        // Revenue
        const clientIds = new Set(assessorClients.map(c => c.id));
        const assessorRevenues = revenues?.filter(r => clientIds.has(r.client_id)) || [];
        const totalRevenue = assessorRevenues.reduce((sum, r) => sum + (r.our_share || 0), 0);
        const monthlyRevenue = assessorRevenues
          .filter(r => new Date(r.date) >= currentMonthStart)
          .reduce((sum, r) => sum + (r.our_share || 0), 0);
        
        // Patrimony
        const totalPatrimony = assessorClients.reduce((sum, c) => sum + (c.patrimony || 0), 0);
        
        // Contracts
        const assessorContracts = contracts?.filter(c => clientIds.has(c.client_id)) || [];
        const lotsTraded = assessorContracts.reduce((sum, c) => sum + (c.lots_traded || 0), 0);
        
        // Avg Ticket
        const avgTicket = assessorClients.length > 0 ? totalRevenue / assessorClients.length : 0;

        assessorMetrics.set(assessorId, {
          id: assessorId,
          name,
          totalClients: assessorClients.length,
          newClients: newClients.length,
          totalLeads: assessorLeads.length,
          convertedLeads,
          lostLeads,
          conversionRate: activeLeads > 0 ? (convertedLeads / activeLeads) * 100 : 0,
          totalRevenue,
          monthlyRevenue,
          totalPatrimony,
          avgTicket,
          lotsTraded,
          ranking: 0,
          score: 0,
        });
      });

      // Calculate score and ranking
      // Score = weighted combination of metrics (normalized)
      const metricsArray = Array.from(assessorMetrics.values());
      
      if (metricsArray.length > 0) {
        const maxRevenue = Math.max(...metricsArray.map(m => m.totalRevenue), 1);
        const maxClients = Math.max(...metricsArray.map(m => m.totalClients), 1);
        const maxConversion = Math.max(...metricsArray.map(m => m.conversionRate), 1);
        const maxLots = Math.max(...metricsArray.map(m => m.lotsTraded), 1);

        metricsArray.forEach(m => {
          m.score = (
            (m.totalRevenue / maxRevenue) * 40 +
            (m.totalClients / maxClients) * 25 +
            (m.conversionRate / maxConversion) * 20 +
            (m.lotsTraded / maxLots) * 15
          );
        });

        // Sort by score and assign ranking
        metricsArray.sort((a, b) => b.score - a.score);
        metricsArray.forEach((m, index) => {
          m.ranking = index + 1;
        });
      }

      // Calculate totals
      const totals = {
        clients: metricsArray.reduce((sum, m) => sum + m.totalClients, 0),
        newClients: metricsArray.reduce((sum, m) => sum + m.newClients, 0),
        leads: metricsArray.reduce((sum, m) => sum + m.totalLeads, 0),
        convertedLeads: metricsArray.reduce((sum, m) => sum + m.convertedLeads, 0),
        revenue: metricsArray.reduce((sum, m) => sum + m.totalRevenue, 0),
        patrimony: metricsArray.reduce((sum, m) => sum + m.totalPatrimony, 0),
        lotsTraded: metricsArray.reduce((sum, m) => sum + m.lotsTraded, 0),
      };

      // Evolution data (monthly revenue and clients per assessor)
      const evolution: PerformanceMetrics['evolution'] = [];
      
      for (let i = 0; i < months; i++) {
        const monthDate = subMonths(new Date(), months - 1 - i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const monthKey = format(monthDate, 'MMM/yy');

        assessorIds.forEach(assessorId => {
          const name = profilesMap.get(assessorId) || 'Desconhecido';
          const clientIds = new Set(
            clients?.filter(c => c.assessor_id === assessorId).map(c => c.id) || []
          );

          const monthRevenue = revenues
            ?.filter(r => {
              const date = parseISO(r.date);
              return clientIds.has(r.client_id) && date >= monthStart && date <= monthEnd;
            })
            .reduce((sum, r) => sum + (r.our_share || 0), 0) || 0;

          const monthClients = clients?.filter(c => {
            const date = parseISO(c.created_at);
            return c.assessor_id === assessorId && date >= monthStart && date <= monthEnd;
          }).length || 0;

          evolution.push({
            month: monthKey,
            assessorId,
            assessorName: name,
            revenue: monthRevenue,
            clients: monthClients,
          });
        });
      }

      // Top performers
      const topPerformers = {
        revenue: metricsArray.length > 0 
          ? metricsArray.reduce((max, m) => m.totalRevenue > max.totalRevenue ? m : max) 
          : null,
        conversion: metricsArray.length > 0 
          ? metricsArray.reduce((max, m) => m.conversionRate > max.conversionRate ? m : max) 
          : null,
        clients: metricsArray.length > 0 
          ? metricsArray.reduce((max, m) => m.totalClients > max.totalClients ? m : max) 
          : null,
      };

      return {
        assessors: metricsArray,
        totals,
        evolution,
        topPerformers,
      };
    },
  });
}
