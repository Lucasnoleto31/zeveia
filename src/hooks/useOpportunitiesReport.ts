import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, startOfMonth, endOfMonth, format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface OpportunityMetrics {
  totalOpportunities: number;
  convertedOpportunities: number;
  lostOpportunities: number;
  activeOpportunities: number;
  conversionRate: number;
  avgConversionDays: number;
  byProduct: ProductConversion[];
  byCampaign: CampaignConversion[];
  byAssessor: AssessorConversion[];
  byMonth: MonthlyOpportunity[];
  topProducts: ProductConversion[];
  lossReasons: LossReasonData[];
}

export interface ProductConversion {
  id: string;
  name: string;
  total: number;
  converted: number;
  lost: number;
  active: number;
  conversionRate: number;
}

export interface CampaignConversion {
  id: string;
  name: string;
  total: number;
  converted: number;
  lost: number;
  active: number;
  conversionRate: number;
}

export interface AssessorConversion {
  id: string;
  name: string;
  total: number;
  converted: number;
  lost: number;
  active: number;
  conversionRate: number;
  avgDays: number;
}

export interface MonthlyOpportunity {
  month: string;
  total: number;
  converted: number;
  lost: number;
  active: number;
}

export interface LossReasonData {
  reason: string;
  count: number;
  percentage: number;
}

export interface OpportunitiesReportOptions {
  months?: number;
  startDate?: string;
  endDate?: string;
}

export function useOpportunitiesReport(options: OpportunitiesReportOptions | number = 6) {
  const opts = typeof options === 'number' ? { months: options } : options;
  const { months = 6, startDate: customStartDate, endDate: customEndDate } = opts;

  return useQuery({
    queryKey: ['opportunities-report', months, customStartDate, customEndDate],
    queryFn: async (): Promise<OpportunityMetrics> => {
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

      // Fetch opportunities (leads with client_id != null)
      async function fetchAllOpportunities() {
        const PAGE_SIZE = 1000;
        let allData: any[] = [];
        let page = 0;
        let hasMore = true;

        while (hasMore) {
          const from = page * PAGE_SIZE;
          const to = from + PAGE_SIZE - 1;

          const { data, error } = await supabase
            .from('leads')
            .select(`
              *,
              target_product:products!leads_target_product_id_fkey(id, name),
              campaign:campaigns(id, name),
              loss_reason:loss_reasons(name)
            `)
            .not('client_id', 'is', null)
            .gte('created_at', startDateISO)
            .lte('created_at', endDateISO)
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

      // Fetch profiles for assessor names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name');

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      const opportunities = await fetchAllOpportunities();

      // Calculate overall metrics
      const totalOpportunities = opportunities.length;
      const convertedOpportunities = opportunities.filter(o => o.status === 'convertido').length;
      const lostOpportunities = opportunities.filter(o => o.status === 'perdido').length;
      const activeOpportunities = opportunities.filter(o => !['convertido', 'perdido'].includes(o.status)).length;
      const conversionRate = totalOpportunities > 0 
        ? (convertedOpportunities / totalOpportunities) * 100 
        : 0;

      // Average conversion days
      const convertedWithDates = opportunities.filter(o => o.status === 'convertido' && o.converted_at);
      const avgConversionDays = convertedWithDates.length > 0
        ? convertedWithDates.reduce((sum, o) => {
            const days = differenceInDays(new Date(o.converted_at), new Date(o.created_at));
            return sum + days;
          }, 0) / convertedWithDates.length
        : 0;

      // By Product
      const productMap = new Map<string, ProductConversion>();
      opportunities.forEach(o => {
        if (!o.target_product) return;
        const key = o.target_product.id;
        const existing = productMap.get(key) || {
          id: key,
          name: o.target_product.name,
          total: 0,
          converted: 0,
          lost: 0,
          active: 0,
          conversionRate: 0,
        };
        existing.total++;
        if (o.status === 'convertido') existing.converted++;
        else if (o.status === 'perdido') existing.lost++;
        else existing.active++;
        productMap.set(key, existing);
      });
      const byProduct = Array.from(productMap.values()).map(p => ({
        ...p,
        conversionRate: p.total > 0 ? (p.converted / p.total) * 100 : 0,
      })).sort((a, b) => b.total - a.total);

      // By Campaign
      const campaignMap = new Map<string, CampaignConversion>();
      opportunities.forEach(o => {
        const key = o.campaign?.id || 'sem-campanha';
        const name = o.campaign?.name || 'Sem Campanha';
        const existing = campaignMap.get(key) || {
          id: key,
          name,
          total: 0,
          converted: 0,
          lost: 0,
          active: 0,
          conversionRate: 0,
        };
        existing.total++;
        if (o.status === 'convertido') existing.converted++;
        else if (o.status === 'perdido') existing.lost++;
        else existing.active++;
        campaignMap.set(key, existing);
      });
      const byCampaign = Array.from(campaignMap.values()).map(c => ({
        ...c,
        conversionRate: c.total > 0 ? (c.converted / c.total) * 100 : 0,
      })).sort((a, b) => b.total - a.total);

      // By Assessor
      const assessorMap = new Map<string, { 
        data: AssessorConversion; 
        conversionDays: number[];
      }>();
      opportunities.forEach(o => {
        const key = o.assessor_id;
        const name = profilesMap.get(key) || 'Desconhecido';
        const existing = assessorMap.get(key) || {
          data: {
            id: key,
            name,
            total: 0,
            converted: 0,
            lost: 0,
            active: 0,
            conversionRate: 0,
            avgDays: 0,
          },
          conversionDays: [],
        };
        existing.data.total++;
        if (o.status === 'convertido') {
          existing.data.converted++;
          if (o.converted_at) {
            const days = differenceInDays(new Date(o.converted_at), new Date(o.created_at));
            existing.conversionDays.push(days);
          }
        } else if (o.status === 'perdido') {
          existing.data.lost++;
        } else {
          existing.data.active++;
        }
        assessorMap.set(key, existing);
      });
      const byAssessor = Array.from(assessorMap.values()).map(({ data, conversionDays }) => ({
        ...data,
        conversionRate: data.total > 0 ? (data.converted / data.total) * 100 : 0,
        avgDays: conversionDays.length > 0 
          ? conversionDays.reduce((a, b) => a + b, 0) / conversionDays.length 
          : 0,
      })).sort((a, b) => b.conversionRate - a.conversionRate);

      // By Month
      const monthMap = new Map<string, MonthlyOpportunity>();
      opportunities.forEach(o => {
        const monthKey = format(new Date(o.created_at), 'MMM/yy', { locale: ptBR });
        const existing = monthMap.get(monthKey) || {
          month: monthKey,
          total: 0,
          converted: 0,
          lost: 0,
          active: 0,
        };
        existing.total++;
        if (o.status === 'convertido') existing.converted++;
        else if (o.status === 'perdido') existing.lost++;
        else existing.active++;
        monthMap.set(monthKey, existing);
      });
      
      // Sort months chronologically
      const byMonth = Array.from(monthMap.entries())
        .sort((a, b) => {
          const dateA = new Date(opportunities.find(o => 
            format(new Date(o.created_at), 'MMM/yy', { locale: ptBR }) === a[0]
          )?.created_at || 0);
          const dateB = new Date(opportunities.find(o => 
            format(new Date(o.created_at), 'MMM/yy', { locale: ptBR }) === b[0]
          )?.created_at || 0);
          return dateA.getTime() - dateB.getTime();
        })
        .map(([, data]) => data);

      // Top products by conversion rate (min 3 opportunities)
      const topProducts = byProduct
        .filter(p => p.total >= 3)
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 5);

      // Loss reasons
      const lossReasonMap = new Map<string, number>();
      opportunities.filter(o => o.status === 'perdido').forEach(o => {
        const reason = o.loss_reason?.name || 'Não especificado';
        lossReasonMap.set(reason, (lossReasonMap.get(reason) || 0) + 1);
      });
      const lossReasons = Array.from(lossReasonMap.entries())
        .map(([reason, count]) => ({
          reason,
          count,
          percentage: lostOpportunities > 0 ? (count / lostOpportunities) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      return {
        totalOpportunities,
        convertedOpportunities,
        lostOpportunities,
        activeOpportunities,
        conversionRate,
        avgConversionDays,
        byProduct,
        byCampaign,
        byAssessor,
        byMonth,
        topProducts,
        lossReasons,
      };
    },
  });
}
