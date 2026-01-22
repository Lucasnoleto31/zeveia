import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadStatus } from '@/types/database';
import { startOfMonth, endOfMonth, subMonths, format, parseISO, differenceInDays, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface FunnelStage {
  status: LeadStatus;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface CohortRetention {
  month: number;
  active: number;
  converted: number;
  lost: number;
  activeRate: number;
  conversionRate: number;
}

export interface CohortData {
  cohort: string;
  cohortDate: Date;
  totalLeads: number;
  retention: CohortRetention[];
  finalConversionRate: number;
  avgTimeToConvert: number | null;
}

export interface DailyLeadMetrics {
  date: string;          // 'yyyy-MM-dd'
  created: number;       // Leads created on this day
  converted: number;     // Leads converted on this day
  lost: number;          // Leads lost on this day
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
  cohortData: CohortData[];
  bestCohort: { cohort: string; rate: number } | null;
  avgRetentionAt3Months: number;
  leadsByDay: DailyLeadMetrics[];
}

const stageConfig: Record<LeadStatus, { label: string; color: string; order: number }> = {
  novo: { label: 'Novo', color: '#3b82f6', order: 1 },
  em_contato: { label: 'Em Contato', color: '#8b5cf6', order: 2 },
  troca_assessoria: { label: 'Troca de Assessoria', color: '#f59e0b', order: 3 },
  convertido: { label: 'Convertido', color: '#22c55e', order: 4 },
  perdido: { label: 'Perdido', color: '#ef4444', order: 5 },
};

export interface FunnelReportOptions {
  months?: number;
  startDate?: string;
  endDate?: string;
}

export function useFunnelReport(options: FunnelReportOptions | number = 6) {
  const opts = typeof options === 'number' ? { months: options } : options;
  const { months = 6, startDate: customStartDate, endDate: customEndDate } = opts;

  return useQuery({
    queryKey: ['funnel-report', months, customStartDate, customEndDate],
    queryFn: async (): Promise<FunnelMetrics> => {
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

      // Batch fetch all leads in the period
      async function fetchAllLeadsForFunnel() {
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
              origin:origins(name),
              campaign:campaigns(name),
              loss_reason:loss_reasons(name)
            `)
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

      const leads = await fetchAllLeadsForFunnel();

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

      // Average conversion time - filter out invalid dates (year < 2000 or converted before created)
      const convertedWithDates = allLeads.filter((l) => {
        if (l.status !== 'convertido' || !l.converted_at) return false;
        const created = parseISO(l.created_at);
        const converted = parseISO(l.converted_at);
        // Ignore invalid dates (conversion before creation or year < 2000)
        return converted.getFullYear() >= 2000 && converted >= created;
      });
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
          month: format(parseISO(`${month}-01`), 'MMM/yy', { locale: ptBR }),
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

      // Cohort Analysis
      const cohortGroups: Record<string, { 
        cohortDate: Date; 
        leads: typeof allLeads 
      }> = {};

      // Group leads by entry month (cohort)
      allLeads.forEach((lead) => {
        const entryDate = parseISO(lead.created_at);
        const cohortKey = format(entryDate, 'yyyy-MM');
        if (!cohortGroups[cohortKey]) {
          cohortGroups[cohortKey] = {
            cohortDate: startOfMonth(entryDate),
            leads: [],
          };
        }
        cohortGroups[cohortKey].leads.push(lead);
      });

      const now = new Date();
      const cohortData: CohortData[] = Object.entries(cohortGroups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, { cohortDate, leads }]) => {
          const totalCohortLeads = leads.length;
          const maxMonthsElapsed = differenceInMonths(now, cohortDate);
          
          // Calculate retention for each month after entry
          const retention: CohortRetention[] = [];
          for (let m = 0; m <= Math.min(maxMonthsElapsed, 5); m++) {
            const checkDate = subMonths(now, maxMonthsElapsed - m);
            
            let active = 0;
            let converted = 0;
            let lost = 0;
            
            leads.forEach((lead) => {
              const createdAt = parseISO(lead.created_at);
              const monthsSinceEntry = differenceInMonths(checkDate, createdAt);
              
              if (monthsSinceEntry >= m) {
                // Check status at this point (simplified - using current status)
                if (lead.status === 'convertido') {
                  const convertedAt = lead.converted_at ? parseISO(lead.converted_at) : null;
                  if (convertedAt && differenceInMonths(convertedAt, createdAt) <= m) {
                    converted++;
                  } else if (!convertedAt || differenceInMonths(convertedAt, createdAt) > m) {
                    active++;
                  } else {
                    converted++;
                  }
                } else if (lead.status === 'perdido') {
                  lost++;
                } else {
                  active++;
                }
              }
            });

            retention.push({
              month: m,
              active,
              converted,
              lost,
              activeRate: totalCohortLeads > 0 ? ((active + converted) / totalCohortLeads) * 100 : 0,
              conversionRate: totalCohortLeads > 0 ? (converted / totalCohortLeads) * 100 : 0,
            });
          }

          // Calculate cohort conversion rate
          const convertedInCohort = leads.filter((l) => l.status === 'convertido').length;
          const finalConversionRate = totalCohortLeads > 0 
            ? (convertedInCohort / totalCohortLeads) * 100 
            : 0;

          // Calculate average time to convert for this cohort
          const convertedWithTime = leads.filter((l) => l.status === 'convertido' && l.converted_at);
          const avgTimeToConvert = convertedWithTime.length > 0
            ? convertedWithTime.reduce((sum, lead) => {
                return sum + differenceInDays(parseISO(lead.converted_at!), parseISO(lead.created_at));
              }, 0) / convertedWithTime.length
            : null;

          return {
            cohort: format(cohortDate, 'MMM/yy', { locale: ptBR }),
            cohortDate,
            totalLeads: totalCohortLeads,
            retention,
            finalConversionRate,
            avgTimeToConvert,
          };
        });

      // Find best performing cohort
      const bestCohort = cohortData.length > 0
        ? cohortData.reduce((best, current) => 
            current.finalConversionRate > (best?.rate || 0) 
              ? { cohort: current.cohort, rate: current.finalConversionRate }
              : best,
            { cohort: '', rate: 0 }
          )
        : null;

      // Calculate average retention at 3 months
      const cohortsWithMonth3 = cohortData.filter((c) => c.retention.length > 3);
      const avgRetentionAt3Months = cohortsWithMonth3.length > 0
        ? cohortsWithMonth3.reduce((sum, c) => sum + (c.retention[3]?.activeRate || 0), 0) / cohortsWithMonth3.length
        : 0;

      // Aggregate leads by day for daily calendar view
      const leadsByDayMap = new Map<string, { created: number; converted: number; lost: number }>();

      allLeads.forEach((lead) => {
        // Count created leads by day
        const createdKey = format(parseISO(lead.created_at), 'yyyy-MM-dd');
        const existingCreated = leadsByDayMap.get(createdKey) || { created: 0, converted: 0, lost: 0 };
        existingCreated.created++;
        leadsByDayMap.set(createdKey, existingCreated);

        // Count converted leads by conversion date
        if (lead.status === 'convertido' && lead.converted_at) {
          const convertedKey = format(parseISO(lead.converted_at), 'yyyy-MM-dd');
          const existingConverted = leadsByDayMap.get(convertedKey) || { created: 0, converted: 0, lost: 0 };
          existingConverted.converted++;
          leadsByDayMap.set(convertedKey, existingConverted);
        }

        // Count lost leads by updated_at (as proxy for loss date)
        if (lead.status === 'perdido' && lead.updated_at) {
          const lostKey = format(parseISO(lead.updated_at), 'yyyy-MM-dd');
          const existingLost = leadsByDayMap.get(lostKey) || { created: 0, converted: 0, lost: 0 };
          existingLost.lost++;
          leadsByDayMap.set(lostKey, existingLost);
        }
      });

      const leadsByDay: DailyLeadMetrics[] = Array.from(leadsByDayMap.entries())
        .map(([date, metrics]) => ({
          date,
          created: metrics.created,
          converted: metrics.converted,
          lost: metrics.lost,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

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
        cohortData,
        bestCohort,
        avgRetentionAt3Months,
        leadsByDay,
      };
    },
  });
}
