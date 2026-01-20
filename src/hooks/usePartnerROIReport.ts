import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Partner } from '@/types/database';
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from 'date-fns';

const PAGE_SIZE = 1000;

async function fetchAllClients() {
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('clients')
      .select('id, name, partner_id, patrimony, active, created_at')
      .not('partner_id', 'is', null)
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

async function fetchAllRevenues(startDateStr: string) {
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('revenues')
      .select('client_id, our_share, date')
      .gte('date', startDateStr)
      .order('date', { ascending: false })
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

export interface PartnerROIMetrics {
  partner: Partner;
  clientCount: number;
  activeClients: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalPatrimony: number;
  estimatedCommission: number;
  roi: number; // Revenue / Commission ratio
  avgRevenuePerClient: number;
  revenueGrowth: number; // % change vs previous period
}

export interface PartnerROIReport {
  partners: PartnerROIMetrics[];
  totals: {
    partners: number;
    clients: number;
    revenue: number;
    patrimony: number;
    commissions: number;
  };
  topPartners: {
    byRevenue: PartnerROIMetrics | null;
    byClients: PartnerROIMetrics | null;
    byROI: PartnerROIMetrics | null;
  };
  revenueByPartnerType: {
    type: string;
    revenue: number;
    clients: number;
  }[];
  monthlyEvolution: {
    month: string;
    partnerId: string;
    partnerName: string;
    revenue: number;
  }[];
}

export interface PartnerROIReportOptions {
  months?: number;
  startDate?: string;
  endDate?: string;
}

export function usePartnerROIReport(options: PartnerROIReportOptions | number = 6) {
  const opts = typeof options === 'number' ? { months: options } : options;
  const { months = 6, startDate: customStartDate, endDate: customEndDate } = opts;

  return useQuery({
    queryKey: ['partner-roi-report', months, customStartDate, customEndDate],
    queryFn: async (): Promise<PartnerROIReport> => {
      let startDate: Date;
      let endDate: Date;
      let previousStartDate: Date;

      if (customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        const diffMonths = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        previousStartDate = subMonths(startDate, diffMonths);
      } else {
        endDate = endOfMonth(new Date());
        startDate = startOfMonth(subMonths(new Date(), months - 1));
        previousStartDate = startOfMonth(subMonths(new Date(), months * 2 - 1));
      }
      const currentMonthStart = startOfMonth(new Date());

      // Get all active partners
      const { data: partners, error: partnersError } = await supabase
        .from('partners')
        .select('*')
        .eq('active', true)
        .order('name');

      if (partnersError) throw partnersError;

      // Get all clients with partner using batch fetching
      const clients = await fetchAllClients();

      // Get revenues using batch fetching
      const revenues = await fetchAllRevenues(previousStartDate.toISOString().split('T')[0]);

      // Create client to partner mapping
      const clientPartnerMap = new Map(clients?.map(c => [c.id, c.partner_id]) || []);

      // Calculate metrics per partner
      const partnerMetrics: PartnerROIMetrics[] = (partners || []).map(partner => {
        const partnerClients = clients?.filter(c => c.partner_id === partner.id) || [];
        const activeClients = partnerClients.filter(c => c.active);
        const clientIds = new Set(partnerClients.map(c => c.id));

        // Current period revenue
        const currentRevenues = revenues?.filter(r => {
          const date = parseISO(r.date);
          return clientIds.has(r.client_id) && date >= startDate && date <= endDate;
        }) || [];
        const totalRevenue = currentRevenues.reduce((sum, r) => sum + (r.our_share || 0), 0);

        // Monthly revenue
        const monthlyRevenues = revenues?.filter(r => {
          const date = parseISO(r.date);
          return clientIds.has(r.client_id) && date >= currentMonthStart;
        }) || [];
        const monthlyRevenue = monthlyRevenues.reduce((sum, r) => sum + (r.our_share || 0), 0);

        // Previous period revenue (for growth calculation)
        const previousRevenues = revenues?.filter(r => {
          const date = parseISO(r.date);
          return clientIds.has(r.client_id) && date >= previousStartDate && date < startDate;
        }) || [];
        const previousRevenue = previousRevenues.reduce((sum, r) => sum + (r.our_share || 0), 0);

        // Patrimony
        const totalPatrimony = activeClients.reduce((sum, c) => sum + (c.patrimony || 0), 0);

        // Commission
        const estimatedCommission = totalRevenue * (partner.commission_percentage / 100);

        // ROI (revenue per commission unit)
        const roi = estimatedCommission > 0 ? totalRevenue / estimatedCommission : 0;

        // Revenue growth
        const revenueGrowth = previousRevenue > 0 
          ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
          : totalRevenue > 0 ? 100 : 0;

        return {
          partner,
          clientCount: partnerClients.length,
          activeClients: activeClients.length,
          totalRevenue,
          monthlyRevenue,
          totalPatrimony,
          estimatedCommission,
          roi,
          avgRevenuePerClient: activeClients.length > 0 ? totalRevenue / activeClients.length : 0,
          revenueGrowth,
        };
      });

      // Sort by revenue
      partnerMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue);

      // Calculate totals
      const totals = {
        partners: partnerMetrics.length,
        clients: partnerMetrics.reduce((sum, p) => sum + p.clientCount, 0),
        revenue: partnerMetrics.reduce((sum, p) => sum + p.totalRevenue, 0),
        patrimony: partnerMetrics.reduce((sum, p) => sum + p.totalPatrimony, 0),
        commissions: partnerMetrics.reduce((sum, p) => sum + p.estimatedCommission, 0),
      };

      // Top partners
      const topPartners = {
        byRevenue: partnerMetrics.length > 0 
          ? partnerMetrics.reduce((max, p) => p.totalRevenue > max.totalRevenue ? p : max)
          : null,
        byClients: partnerMetrics.length > 0 
          ? partnerMetrics.reduce((max, p) => p.clientCount > max.clientCount ? p : max)
          : null,
        byROI: partnerMetrics.length > 0 
          ? partnerMetrics.reduce((max, p) => p.roi > max.roi ? p : max)
          : null,
      };

      // Revenue by partner type
      const typeData: Record<string, { revenue: number; clients: number }> = {};
      partnerMetrics.forEach(p => {
        const type = p.partner.type === 'parceiro' ? 'Parceiro' : 'Influenciador';
        if (!typeData[type]) {
          typeData[type] = { revenue: 0, clients: 0 };
        }
        typeData[type].revenue += p.totalRevenue;
        typeData[type].clients += p.clientCount;
      });
      const revenueByPartnerType = Object.entries(typeData).map(([type, data]) => ({
        type,
        revenue: data.revenue,
        clients: data.clients,
      }));

      // Monthly evolution per partner
      const monthlyEvolution: PartnerROIReport['monthlyEvolution'] = [];
      for (let i = 0; i < months; i++) {
        const monthDate = subMonths(new Date(), months - 1 - i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const monthKey = format(monthDate, 'MMM/yy');

        (partners || []).forEach(partner => {
          const partnerClients = clients?.filter(c => c.partner_id === partner.id) || [];
          const clientIds = new Set(partnerClients.map(c => c.id));

          const monthRevenue = revenues
            ?.filter(r => {
              const date = parseISO(r.date);
              return clientIds.has(r.client_id) && date >= monthStart && date <= monthEnd;
            })
            .reduce((sum, r) => sum + (r.our_share || 0), 0) || 0;

          if (monthRevenue > 0) {
            monthlyEvolution.push({
              month: monthKey,
              partnerId: partner.id,
              partnerName: partner.name,
              revenue: monthRevenue,
            });
          }
        });
      }

      return {
        partners: partnerMetrics,
        totals,
        topPartners,
        revenueByPartnerType,
        monthlyEvolution,
      };
    },
  });
}
