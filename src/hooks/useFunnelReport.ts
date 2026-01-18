import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadStatus } from '@/types/database';
import { startOfMonth, endOfMonth, subMonths, format, parseISO, differenceInDays } from 'date-fns';

export interface FunnelStage {
  status: LeadStatus;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface FunnelMetrics {
  stages: FunnelStage[];
  totalLeads: number;
  convertedLeads: number;
  lostLeads: number;
  conversionRate: number;
  avgConversionDays: number;
  leadsByMonth: { month: string; novo: number; convertido: number; perdido: number }[];
  leadsByOrigin: { origin: string; count: number }[];
  leadsByCampaign: { campaign: string; count: number }[];
  leadsByAssessor: { assessor: string; count: number; converted: number; rate: number }[];
  lossReasons: { reason: string; count: number }[];
}

const stageConfig: Record<LeadStatus, { label: string; color: string; order: number }> = {
  novo: { label: 'Novo', color: '#3b82f6', order: 1 },
  em_contato: { label: 'Em Contato', color: '#8b5cf6', order: 2 },
  troca_assessoria: { label: 'Troca de Assessoria', color: '#f59e0b', order: 3 },
  convertido: { label: 'Convertido', color: '#22c55e', order: 4 },
  perdido: { label: 'Perdido', color: '#ef4444', order: 5 },
};

export function useFunnelReport(months: number = 6) {
  return useQuery({
    queryKey: ['funnel-report', months],
    queryFn: async (): Promise<FunnelMetrics> => {
      const endDate = endOfMonth(new Date());
      const startDate = startOfMonth(subMonths(new Date(), months - 1));

      // Get all leads in the period
      const { data: leads, error } = await supabase
        .from('leads')
        .select(`
          *,
          origin:origins(name),
          campaign:campaigns(name),
          loss_reason:loss_reasons(name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Get assessor profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name');

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      const allLeads = (leads || []).map(lead => ({
        ...lead,
        assessor: { name: profilesMap.get(lead.assessor_id) || 'Não atribuído' }
      }));

      // Calculate stages
      const statusCounts: Record<LeadStatus, number> = {
        novo: 0,
        em_contato: 0,
        troca_assessoria: 0,
        convertido: 0,
        perdido: 0,
      };

      allLeads.forEach((lead) => {
        statusCounts[lead.status as LeadStatus]++;
      });

      const totalLeads = allLeads.length;
      const stages: FunnelStage[] = (Object.keys(stageConfig) as LeadStatus[])
        .sort((a, b) => stageConfig[a].order - stageConfig[b].order)
        .map((status) => ({
          status,
          label: stageConfig[status].label,
          count: statusCounts[status],
          percentage: totalLeads > 0 ? (statusCounts[status] / totalLeads) * 100 : 0,
          color: stageConfig[status].color,
        }));

      // Conversion metrics
      const convertedLeads = statusCounts.convertido;
      const lostLeads = statusCounts.perdido;
      const activeLeads = totalLeads - lostLeads;
      const conversionRate = activeLeads > 0 ? (convertedLeads / activeLeads) * 100 : 0;

      // Average conversion time
      const convertedWithDates = allLeads.filter(
        (l) => l.status === 'convertido' && l.converted_at
      );
      const avgConversionDays =
        convertedWithDates.length > 0
          ? convertedWithDates.reduce((sum, lead) => {
              const created = parseISO(lead.created_at);
              const converted = parseISO(lead.converted_at!);
              return sum + differenceInDays(converted, created);
            }, 0) / convertedWithDates.length
          : 0;

      // Leads by month
      const monthsData: Record<string, { novo: number; convertido: number; perdido: number }> = {};
      for (let i = 0; i < months; i++) {
        const monthDate = subMonths(new Date(), i);
        const monthKey = format(monthDate, 'yyyy-MM');
        monthsData[monthKey] = { novo: 0, convertido: 0, perdido: 0 };
      }

      allLeads.forEach((lead) => {
        const monthKey = format(parseISO(lead.created_at), 'yyyy-MM');
        if (monthsData[monthKey]) {
          monthsData[monthKey].novo++;
          if (lead.status === 'convertido') monthsData[monthKey].convertido++;
          if (lead.status === 'perdido') monthsData[monthKey].perdido++;
        }
      });

      const leadsByMonth = Object.entries(monthsData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month: format(parseISO(`${month}-01`), 'MMM/yy'),
          ...data,
        }));

      // Leads by origin
      const originCounts: Record<string, number> = {};
      allLeads.forEach((lead) => {
        const origin = lead.origin?.name || 'Não informado';
        originCounts[origin] = (originCounts[origin] || 0) + 1;
      });
      const leadsByOrigin = Object.entries(originCounts)
        .map(([origin, count]) => ({ origin, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Leads by campaign
      const campaignCounts: Record<string, number> = {};
      allLeads.forEach((lead) => {
        const campaign = lead.campaign?.name || 'Sem campanha';
        campaignCounts[campaign] = (campaignCounts[campaign] || 0) + 1;
      });
      const leadsByCampaign = Object.entries(campaignCounts)
        .map(([campaign, count]) => ({ campaign, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Leads by assessor with conversion rate
      const assessorData: Record<string, { count: number; converted: number }> = {};
      allLeads.forEach((lead) => {
        const assessor = lead.assessor?.name || 'Não atribuído';
        if (!assessorData[assessor]) {
          assessorData[assessor] = { count: 0, converted: 0 };
        }
        assessorData[assessor].count++;
        if (lead.status === 'convertido') assessorData[assessor].converted++;
      });
      const leadsByAssessor = Object.entries(assessorData)
        .map(([assessor, data]) => ({
          assessor,
          count: data.count,
          converted: data.converted,
          rate: data.count > 0 ? (data.converted / data.count) * 100 : 0,
        }))
        .sort((a, b) => b.rate - a.rate);

      // Loss reasons
      const lossReasonCounts: Record<string, number> = {};
      allLeads
        .filter((l) => l.status === 'perdido')
        .forEach((lead) => {
          const reason = lead.loss_reason?.name || 'Não informado';
          lossReasonCounts[reason] = (lossReasonCounts[reason] || 0) + 1;
        });
      const lossReasons = Object.entries(lossReasonCounts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);

      return {
        stages,
        totalLeads,
        convertedLeads,
        lostLeads,
        conversionRate,
        avgConversionDays,
        leadsByMonth,
        leadsByOrigin,
        leadsByCampaign,
        leadsByAssessor,
        lossReasons,
      };
    },
  });
}
