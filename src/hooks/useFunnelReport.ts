import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadStatus } from '@/types/database';
import { startOfMonth, endOfMonth, subMonths, format, parseISO, differenceInDays, differenceInMonths, addMonths, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface FunnelStage {
  status: LeadStatus;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface CohortRetention {
  month: number;           // Mês após conversão (0 = mês da conversão)
  converted: number;       // Total de leads convertidos em clientes neste cohort
  retained: number;        // Clientes que geraram receita neste mês
  retentionRate: number;   // % de retenção (retained / converted * 100)
  isFuture: boolean;       // Se o mês ainda não ocorreu
}

export interface CohortData {
  cohort: string;
  cohortDate: Date;
  totalLeads: number;
  convertedLeads: number;  // Total de leads com status 'convertido'
  trackedLeads: number;    // Leads convertidos com cliente vinculado (para rastreamento de receita)
  retention: CohortRetention[];
  finalConversionRate: number;
  avgTimeToConvert: number | null;
}

export interface LeadWithDetails {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  created_at: string;
  converted_at?: string | null;
  updated_at: string;
  origin?: { name: string } | null;
  campaign?: { name: string } | null;
  assessor?: { name: string } | null;
}

export interface DailyLeadMetrics {
  date: string;          // 'yyyy-MM-dd'
  created: number;       // Leads created on this day
  converted: number;     // Leads converted on this day
  lost: number;          // Leads lost on this day
}

export interface CampaignDetails {
  campaign: string;
  campaignId: string | null;
  firstLeadDate: string;
  lastLeadDate: string;
  total: number;
  converted: number;
  lost: number;
  inProgress: number;
  conversionRate: number;
  lossReasons: { reason: string; count: number }[];
  origins: { origin: string; count: number }[];
  assessors: { assessor: string; count: number; converted: number }[];
}

export interface FunnelMetrics {
  stages: FunnelStage[];
  totalLeads: number;
  convertedLeads: number;
  lostLeads: number;
  inProgressLeads: number;
  conversionRate: number;
  avgConversionDays: number;
  leadsByMonth: { month: string; novo: number; convertido: number; perdido: number }[];
  leadsByOrigin: { origin: string; count: number }[];
  leadsByCampaign: { campaign: string; total: number; converted: number; lost: number; rate: number }[];
  leadsByAssessor: { assessor: string; count: number; converted: number; rate: number }[];
  lossReasons: { reason: string; count: number }[];
  cohortData: CohortData[];
  bestCohort: { cohort: string; rate: number } | null;
  avgRetentionAt3Months: number;
  leadsByDay: DailyLeadMetrics[];
  allLeadsWithDetails: LeadWithDetails[];
  campaignDetails: CampaignDetails[];
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

      // Fetch clients converted from leads (for cohort retention)
      async function fetchClientsFromLeads() {
        const PAGE_SIZE = 1000;
        let allData: any[] = [];
        let page = 0;
        let hasMore = true;

        while (hasMore) {
          const from = page * PAGE_SIZE;
          const to = from + PAGE_SIZE - 1;

          const { data, error } = await supabase
            .from('clients')
            .select('id, converted_from_lead_id, created_at')
            .not('converted_from_lead_id', 'is', null)
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

      // Fetch revenues for retention calculation
      async function fetchRevenuesForRetention() {
        const PAGE_SIZE = 1000;
        let allData: any[] = [];
        let page = 0;
        let hasMore = true;

        while (hasMore) {
          const from = page * PAGE_SIZE;
          const to = from + PAGE_SIZE - 1;

          const { data, error } = await supabase
            .from('revenues')
            .select('client_id, date')
            .gte('date', startDateISO.slice(0, 10))
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

      // Parallel fetch all data
      const [leads, clientsFromLeads, revenuesData, profilesResult] = await Promise.all([
        fetchAllLeadsForFunnel(),
        fetchClientsFromLeads(),
        fetchRevenuesForRetention(),
        supabase.from('profiles').select('user_id, name')
      ]);

      const profiles = profilesResult.data;
      const profilesMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      // Build lead -> client mapping
      const leadToClient = new Map<string, string>(
        clientsFromLeads?.map((c: any) => [c.converted_from_lead_id, c.id]) || []
      );

      // Build client -> revenue months mapping
      const clientRevenueMonths = new Map<string, Set<string>>();
      revenuesData?.forEach((r: any) => {
        const monthKey = r.date.slice(0, 7); // 'yyyy-MM'
        if (!clientRevenueMonths.has(r.client_id)) {
          clientRevenueMonths.set(r.client_id, new Set());
        }
        clientRevenueMonths.get(r.client_id)!.add(monthKey);
      });

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

      // Leads by campaign with conversion data
      const campaignData: Record<string, { total: number; converted: number; lost: number }> = {};
      allLeads.forEach((lead) => {
        const campaign = lead.campaign?.name || 'Sem campanha';
        if (!campaignData[campaign]) {
          campaignData[campaign] = { total: 0, converted: 0, lost: 0 };
        }
        campaignData[campaign].total++;
        if (lead.status === 'convertido') campaignData[campaign].converted++;
        if (lead.status === 'perdido') campaignData[campaign].lost++;
      });
      const leadsByCampaign = Object.entries(campaignData)
        .map(([campaign, d]) => ({
          campaign,
          total: d.total,
          converted: d.converted,
          lost: d.lost,
          rate: d.total > 0 ? (d.converted / d.total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      // NEW: Detailed campaign data for campaign cards
      const campaignDetailsMap: Record<string, {
        campaignId: string | null;
        leads: typeof allLeads;
        firstDate: string;
        lastDate: string;
      }> = {};

      allLeads.forEach((lead) => {
        const campaignName = lead.campaign?.name || 'Sem campanha';
        const campaignId = lead.campaign_id || null;
        
        if (!campaignDetailsMap[campaignName]) {
          campaignDetailsMap[campaignName] = {
            campaignId,
            leads: [],
            firstDate: lead.created_at,
            lastDate: lead.created_at,
          };
        }
        
        campaignDetailsMap[campaignName].leads.push(lead);
        
        if (lead.created_at < campaignDetailsMap[campaignName].firstDate) {
          campaignDetailsMap[campaignName].firstDate = lead.created_at;
        }
        if (lead.created_at > campaignDetailsMap[campaignName].lastDate) {
          campaignDetailsMap[campaignName].lastDate = lead.created_at;
        }
      });

      const campaignDetails: CampaignDetails[] = Object.entries(campaignDetailsMap)
        .map(([campaignName, data]) => {
          const leads = data.leads;
          const total = leads.length;
          const converted = leads.filter(l => l.status === 'convertido').length;
          const lost = leads.filter(l => l.status === 'perdido').length;
          const inProgress = total - converted - lost;

          // Loss reasons for this campaign
          const lossReasonCounts: Record<string, number> = {};
          leads.filter(l => l.status === 'perdido').forEach((lead) => {
            const reason = lead.loss_reason?.name || 'Não informado';
            lossReasonCounts[reason] = (lossReasonCounts[reason] || 0) + 1;
          });
          const lossReasons = Object.entries(lossReasonCounts)
            .map(([reason, count]) => ({ reason, count }))
            .sort((a, b) => b.count - a.count);

          // Origins for this campaign
          const originCounts: Record<string, number> = {};
          leads.forEach((lead) => {
            const origin = lead.origin?.name || 'Não informado';
            originCounts[origin] = (originCounts[origin] || 0) + 1;
          });
          const origins = Object.entries(originCounts)
            .map(([origin, count]) => ({ origin, count }))
            .sort((a, b) => b.count - a.count);

          // Assessors for this campaign
          const assessorCounts: Record<string, { count: number; converted: number }> = {};
          leads.forEach((lead) => {
            const assessor = lead.assessor?.name || 'Não atribuído';
            if (!assessorCounts[assessor]) {
              assessorCounts[assessor] = { count: 0, converted: 0 };
            }
            assessorCounts[assessor].count++;
            if (lead.status === 'convertido') assessorCounts[assessor].converted++;
          });
          const assessors = Object.entries(assessorCounts)
            .map(([assessor, d]) => ({ assessor, count: d.count, converted: d.converted }))
            .sort((a, b) => b.count - a.count);

          return {
            campaign: campaignName,
            campaignId: data.campaignId,
            firstLeadDate: data.firstDate.slice(0, 10),
            lastLeadDate: data.lastDate.slice(0, 10),
            total,
            converted,
            lost,
            inProgress,
            conversionRate: total > 0 ? (converted / total) * 100 : 0,
            lossReasons,
            origins,
            assessors,
          };
        })
        .sort((a, b) => b.firstLeadDate.localeCompare(a.firstLeadDate) || b.total - a.total);

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

      // Calculate in progress leads
      const inProgressLeads = totalLeads - convertedLeads - lostLeads;

      // Cohort Analysis - NEW: Based on revenue retention
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
      const currentMonthKey = format(now, 'yyyy-MM');

      const cohortData: CohortData[] = Object.entries(cohortGroups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, { cohortDate, leads }]) => {
          const totalCohortLeads = leads.length;
          
          // Count ALL converted leads (regardless of client link)
          const allConvertedLeads = leads.filter((lead) => lead.status === 'convertido');
          const totalConverted = allConvertedLeads.length;
          
          // Filter only converted leads with a linked client (for retention tracking)
          const convertedLeadsWithClient = allConvertedLeads.filter((lead) => {
            if (!lead.converted_at) return false;
            const clientId = leadToClient.get(lead.id);
            return !!clientId;
          });
          const trackedConverted = convertedLeadsWithClient.length;

          // Calculate retention based on revenue for each month after conversion
          // Use trackedConverted as base for retention calculation
          const maxMonthsToShow = 6;
          const retention: CohortRetention[] = [];

          for (let m = 0; m < maxMonthsToShow; m++) {
            // The check month is m months after the cohort month
            const checkMonthDate = addMonths(cohortDate, m);
            const checkMonthKey = format(checkMonthDate, 'yyyy-MM');
            
            // Determine if this month is in the future
            const isFuture = isBefore(new Date(), startOfMonth(checkMonthDate));

            if (isFuture) {
              retention.push({
                month: m,
                converted: trackedConverted,
                retained: 0,
                retentionRate: 0,
                isFuture: true,
              });
              continue;
            }

            // Count how many tracked clients generated revenue in this month
            let retainedCount = 0;
            convertedLeadsWithClient.forEach((lead) => {
              const clientId = leadToClient.get(lead.id);
              if (!clientId) return;

              const conversionDate = parseISO(lead.converted_at!);
              const conversionMonthKey = format(conversionDate, 'yyyy-MM');

              // Only count if conversion happened on or before the check month
              if (conversionMonthKey > checkMonthKey) return;

              const revenueMonths = clientRevenueMonths.get(clientId);
              if (revenueMonths?.has(checkMonthKey)) {
                retainedCount++;
              }
            });

            retention.push({
              month: m,
              converted: trackedConverted,
              retained: retainedCount,
              retentionRate: trackedConverted > 0 ? (retainedCount / trackedConverted) * 100 : 0,
              isFuture: false,
            });
          }

          // Calculate cohort conversion rate (leads -> converted leads)
          const finalConversionRate = totalCohortLeads > 0 
            ? (totalConverted / totalCohortLeads) * 100 
            : 0;

          // Calculate average time to convert for this cohort
          const convertedWithTime = allConvertedLeads.filter((l) => l.converted_at);
          const avgTimeToConvert = convertedWithTime.length > 0
            ? convertedWithTime.reduce((sum, lead) => {
                return sum + differenceInDays(parseISO(lead.converted_at!), parseISO(lead.created_at));
              }, 0) / convertedWithTime.length
            : null;

          return {
            cohort: format(cohortDate, 'MMM/yy', { locale: ptBR }),
            cohortDate,
            totalLeads: totalCohortLeads,
            convertedLeads: totalConverted,      // All converted leads
            trackedLeads: trackedConverted,      // Only those with client link
            retention,
            finalConversionRate,
            avgTimeToConvert,
          };
        });

      // Find best performing cohort (highest retention at month 3, or latest available)
      const bestCohort = cohortData.length > 0
        ? cohortData.reduce((best, current) => {
            // Look for retention at month 3, or fallback to the best available
            const month3Retention = current.retention.find(r => r.month === 3 && !r.isFuture);
            const bestMonth3Retention = best ? (cohortData.find(c => c.cohort === best.cohort)?.retention.find(r => r.month === 3 && !r.isFuture)) : null;
            
            const currentRate = month3Retention?.retentionRate ?? current.finalConversionRate;
            const bestRate = bestMonth3Retention?.retentionRate ?? best?.rate ?? 0;
            
            return currentRate > bestRate 
              ? { cohort: current.cohort, rate: currentRate }
              : best;
          }, { cohort: '', rate: 0 } as { cohort: string; rate: number })
        : null;

      // Calculate average retention at 3 months
      const cohortsWithMonth3 = cohortData.filter((c) => {
        const month3 = c.retention.find(r => r.month === 3);
        return month3 && !month3.isFuture;
      });
      const avgRetentionAt3Months = cohortsWithMonth3.length > 0
        ? cohortsWithMonth3.reduce((sum, c) => {
            const month3 = c.retention.find(r => r.month === 3);
            return sum + (month3?.retentionRate || 0);
          }, 0) / cohortsWithMonth3.length
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
        inProgressLeads,
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
        allLeadsWithDetails: allLeads as LeadWithDetails[],
        campaignDetails,
      };
    },
  });
}
