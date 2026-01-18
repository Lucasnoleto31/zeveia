import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, format, startOfMonth } from 'date-fns';

interface PlatformStats {
  id: string;
  name: string;
  clientCount: number;
  totalCost: number;
  avgCostPerClient: number;
  lotsTraded: number;
  costPerLot: number;
}

interface StateStats {
  state: string;
  totalCost: number;
  clientCount: number;
  topPlatform: string;
}

interface PartnerStats {
  id: string;
  name: string;
  platformCount: number;
  clientCount: number;
  totalCost: number;
  topPlatform: string;
}

interface MonthlyEvolution {
  month: string;
  totalCost: number;
  clientCount: number;
  growthPercent: number;
}

interface ClientRanking {
  id: string;
  name: string;
  totalCost: number;
  platformCount: number;
  avgCostPerPlatform: number;
}

interface AssessorStats {
  id: string;
  name: string;
  clientCount: number;
  totalCost: number;
  avgCostPerClient: number;
  topPlatform: string;
}

export interface PlatformsReportData {
  // Summary
  totalPlatforms: number;
  totalCost: number;
  avgMonthlyCost: number;
  mostContractedPlatform: string;
  highestCostPlatform: string;
  momGrowth: number;

  // By Platform
  platformStats: PlatformStats[];

  // By State
  stateStats: StateStats[];

  // By Partner
  partnerStats: PartnerStats[];

  // Monthly Evolution
  monthlyEvolution: MonthlyEvolution[];

  // Rankings
  topClientsByCost: ClientRanking[];
  multiPlatformClients: number;
  multiPlatformClientsPercent: number;

  // Concentration
  topPlatformConcentration: number;

  // Adoption
  newContractsThisMonth: number;
  adoptionTrend: { month: string; newContracts: number }[];

  // By Assessor (for socios)
  assessorStats: AssessorStats[];

  // Efficiency
  avgCostPerLot: number;
  mostEfficientPlatform: string;
}

export interface PlatformsReportOptions {
  months?: number;
  startDate?: string;
  endDate?: string;
}

export function usePlatformsReport(options: PlatformsReportOptions | number = 12) {
  const opts = typeof options === 'number' ? { months: options } : options;
  const { months = 12, startDate: customStartDate, endDate: customEndDate } = opts;

  return useQuery({
    queryKey: ['platformsReport', months, customStartDate, customEndDate],
    queryFn: async (): Promise<PlatformsReportData> => {
      let startDateStr: string;
      let endDateStr: string | undefined;

      if (customStartDate && customEndDate) {
        startDateStr = customStartDate;
        endDateStr = customEndDate;
      } else {
        startDateStr = format(subMonths(startOfMonth(new Date()), months - 1), 'yyyy-MM-dd');
      }

      // Fetch platform costs with relations
      let costsQuery = supabase
        .from('platform_costs')
        .select(`
          id,
          client_id,
          platform_id,
          date,
          value,
          client:clients(id, name, state, partner_id, assessor_id, partner:partners(id, name)),
          platform:platforms(id, name)
        `)
        .gte('date', startDateStr);

      if (endDateStr) {
        costsQuery = costsQuery.lte('date', endDateStr);
      }

      const { data: platformCosts, error: costsError } = await costsQuery;

      if (costsError) throw costsError;

      // Fetch contracts with platform info
      let contractsQuery = supabase
        .from('contracts')
        .select(`
          id,
          client_id,
          platform_id,
          lots_traded,
          lots_zeroed,
          date,
          platform:platforms(id, name)
        `)
        .gte('date', startDateStr);

      if (endDateStr) {
        contractsQuery = contractsQuery.lte('date', endDateStr);
      }

      const { data: contracts, error: contractsError } = await contractsQuery;

      if (contractsError) throw contractsError;

      // Fetch all platforms
      const { data: platforms, error: platformsError } = await supabase
        .from('platforms')
        .select('id, name')
        .eq('active', true);

      if (platformsError) throw platformsError;

      // Fetch profiles for assessor names
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name');

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      // Process data
      const costs = platformCosts || [];
      const contractsData = contracts || [];

      // Platform stats
      const platformMap = new Map<string, {
        id: string;
        name: string;
        clients: Set<string>;
        totalCost: number;
        lotsTraded: number;
      }>();

      costs.forEach((c: any) => {
        const platformId = c.platform_id;
        const platformName = c.platform?.name || 'Sem plataforma';
        
        if (!platformMap.has(platformId)) {
          platformMap.set(platformId, {
            id: platformId,
            name: platformName,
            clients: new Set(),
            totalCost: 0,
            lotsTraded: 0,
          });
        }
        
        const stats = platformMap.get(platformId)!;
        stats.clients.add(c.client_id);
        stats.totalCost += Number(c.value);
      });

      // Add lots traded from contracts
      contractsData.forEach((c: any) => {
        const platformId = c.platform_id;
        if (platformMap.has(platformId)) {
          platformMap.get(platformId)!.lotsTraded += Number(c.lots_traded);
        }
      });

      const platformStats: PlatformStats[] = Array.from(platformMap.values()).map(p => ({
        id: p.id,
        name: p.name,
        clientCount: p.clients.size,
        totalCost: p.totalCost,
        avgCostPerClient: p.clients.size > 0 ? p.totalCost / p.clients.size : 0,
        lotsTraded: p.lotsTraded,
        costPerLot: p.lotsTraded > 0 ? p.totalCost / p.lotsTraded : 0,
      })).sort((a, b) => b.totalCost - a.totalCost);

      // State stats
      const stateMap = new Map<string, {
        state: string;
        clients: Set<string>;
        totalCost: number;
        platformCounts: Map<string, number>;
      }>();

      costs.forEach((c: any) => {
        const state = c.client?.state || 'Não informado';
        
        if (!stateMap.has(state)) {
          stateMap.set(state, {
            state,
            clients: new Set(),
            totalCost: 0,
            platformCounts: new Map(),
          });
        }
        
        const stats = stateMap.get(state)!;
        stats.clients.add(c.client_id);
        stats.totalCost += Number(c.value);
        
        const platformName = c.platform?.name || 'Sem plataforma';
        stats.platformCounts.set(platformName, (stats.platformCounts.get(platformName) || 0) + 1);
      });

      const stateStats: StateStats[] = Array.from(stateMap.values()).map(s => {
        let topPlatform = '';
        let maxCount = 0;
        s.platformCounts.forEach((count, platform) => {
          if (count > maxCount) {
            maxCount = count;
            topPlatform = platform;
          }
        });
        
        return {
          state: s.state,
          totalCost: s.totalCost,
          clientCount: s.clients.size,
          topPlatform,
        };
      }).sort((a, b) => b.totalCost - a.totalCost);

      // Partner stats
      const partnerMap = new Map<string, {
        id: string;
        name: string;
        clients: Set<string>;
        platforms: Set<string>;
        totalCost: number;
        platformCounts: Map<string, number>;
      }>();

      costs.forEach((c: any) => {
        const partnerId = c.client?.partner_id;
        if (!partnerId) return;
        
        const partnerName = c.client?.partner?.name || 'Sem parceiro';
        
        if (!partnerMap.has(partnerId)) {
          partnerMap.set(partnerId, {
            id: partnerId,
            name: partnerName,
            clients: new Set(),
            platforms: new Set(),
            totalCost: 0,
            platformCounts: new Map(),
          });
        }
        
        const stats = partnerMap.get(partnerId)!;
        stats.clients.add(c.client_id);
        stats.platforms.add(c.platform_id);
        stats.totalCost += Number(c.value);
        
        const platformName = c.platform?.name || 'Sem plataforma';
        stats.platformCounts.set(platformName, (stats.platformCounts.get(platformName) || 0) + 1);
      });

      const partnerStats: PartnerStats[] = Array.from(partnerMap.values()).map(p => {
        let topPlatform = '';
        let maxCount = 0;
        p.platformCounts.forEach((count, platform) => {
          if (count > maxCount) {
            maxCount = count;
            topPlatform = platform;
          }
        });
        
        return {
          id: p.id,
          name: p.name,
          platformCount: p.platforms.size,
          clientCount: p.clients.size,
          totalCost: p.totalCost,
          topPlatform,
        };
      }).sort((a, b) => b.totalCost - a.totalCost);

      // Monthly evolution
      const monthlyMap = new Map<string, {
        totalCost: number;
        clients: Set<string>;
        firstAppearances: Set<string>;
      }>();

      const clientFirstMonth = new Map<string, string>();

      costs.forEach((c: any) => {
        const month = c.date.slice(0, 7);
        const clientId = c.client_id;
        
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, {
            totalCost: 0,
            clients: new Set(),
            firstAppearances: new Set(),
          });
        }
        
        const stats = monthlyMap.get(month)!;
        stats.totalCost += Number(c.value);
        stats.clients.add(clientId);
        
        // Track first appearance
        if (!clientFirstMonth.has(clientId)) {
          clientFirstMonth.set(clientId, month);
          stats.firstAppearances.add(clientId);
        } else if (clientFirstMonth.get(clientId) === month) {
          stats.firstAppearances.add(clientId);
        }
      });

      const sortedMonths = Array.from(monthlyMap.keys()).sort();
      let prevCost = 0;
      
      const monthlyEvolution: MonthlyEvolution[] = sortedMonths.map(month => {
        const stats = monthlyMap.get(month)!;
        const growthPercent = prevCost > 0 ? ((stats.totalCost - prevCost) / prevCost) * 100 : 0;
        prevCost = stats.totalCost;
        
        return {
          month,
          totalCost: stats.totalCost,
          clientCount: stats.clients.size,
          growthPercent,
        };
      });

      // Adoption trend
      const adoptionTrend = sortedMonths.map(month => ({
        month,
        newContracts: monthlyMap.get(month)!.firstAppearances.size,
      }));

      // Client rankings
      const clientCostMap = new Map<string, {
        id: string;
        name: string;
        totalCost: number;
        platforms: Set<string>;
      }>();

      costs.forEach((c: any) => {
        const clientId = c.client_id;
        const clientName = c.client?.name || 'Cliente desconhecido';
        
        if (!clientCostMap.has(clientId)) {
          clientCostMap.set(clientId, {
            id: clientId,
            name: clientName,
            totalCost: 0,
            platforms: new Set(),
          });
        }
        
        const stats = clientCostMap.get(clientId)!;
        stats.totalCost += Number(c.value);
        stats.platforms.add(c.platform_id);
      });

      const topClientsByCost: ClientRanking[] = Array.from(clientCostMap.values())
        .map(c => ({
          id: c.id,
          name: c.name,
          totalCost: c.totalCost,
          platformCount: c.platforms.size,
          avgCostPerPlatform: c.platforms.size > 0 ? c.totalCost / c.platforms.size : 0,
        }))
        .sort((a, b) => b.totalCost - a.totalCost)
        .slice(0, 10);

      // Multi-platform clients
      const totalClientsWithPlatforms = clientCostMap.size;
      const multiPlatformClients = Array.from(clientCostMap.values()).filter(c => c.platforms.size > 1).length;
      const multiPlatformClientsPercent = totalClientsWithPlatforms > 0 
        ? (multiPlatformClients / totalClientsWithPlatforms) * 100 
        : 0;

      // Assessor stats
      const assessorMap = new Map<string, {
        id: string;
        clients: Set<string>;
        totalCost: number;
        platformCounts: Map<string, number>;
      }>();

      costs.forEach((c: any) => {
        const assessorId = c.client?.assessor_id;
        if (!assessorId) return;
        
        if (!assessorMap.has(assessorId)) {
          assessorMap.set(assessorId, {
            id: assessorId,
            clients: new Set(),
            totalCost: 0,
            platformCounts: new Map(),
          });
        }
        
        const stats = assessorMap.get(assessorId)!;
        stats.clients.add(c.client_id);
        stats.totalCost += Number(c.value);
        
        const platformName = c.platform?.name || 'Sem plataforma';
        stats.platformCounts.set(platformName, (stats.platformCounts.get(platformName) || 0) + 1);
      });

      const assessorStats: AssessorStats[] = Array.from(assessorMap.entries()).map(([id, a]) => {
        let topPlatform = '';
        let maxCount = 0;
        a.platformCounts.forEach((count, platform) => {
          if (count > maxCount) {
            maxCount = count;
            topPlatform = platform;
          }
        });
        
        return {
          id,
          name: profilesMap.get(id) || 'Assessor desconhecido',
          clientCount: a.clients.size,
          totalCost: a.totalCost,
          avgCostPerClient: a.clients.size > 0 ? a.totalCost / a.clients.size : 0,
          topPlatform,
        };
      }).sort((a, b) => b.totalCost - a.totalCost);

      // Summary calculations
      const totalCost = costs.reduce((sum, c: any) => sum + Number(c.value), 0);
      const totalPlatforms = platformMap.size;
      const avgMonthlyCost = monthlyEvolution.length > 0 
        ? totalCost / monthlyEvolution.length 
        : 0;

      const mostContractedPlatform = platformStats.length > 0 
        ? platformStats.reduce((a, b) => a.clientCount > b.clientCount ? a : b).name 
        : '-';

      const highestCostPlatform = platformStats.length > 0 
        ? platformStats[0].name 
        : '-';

      const lastTwoMonths = monthlyEvolution.slice(-2);
      const momGrowth = lastTwoMonths.length === 2 && lastTwoMonths[0].totalCost > 0
        ? ((lastTwoMonths[1].totalCost - lastTwoMonths[0].totalCost) / lastTwoMonths[0].totalCost) * 100
        : 0;

      const topPlatformConcentration = platformStats.length > 0 && totalClientsWithPlatforms > 0
        ? (platformStats[0].clientCount / totalClientsWithPlatforms) * 100
        : 0;

      const currentMonth = format(new Date(), 'yyyy-MM');
      const newContractsThisMonth = monthlyMap.get(currentMonth)?.firstAppearances.size || 0;

      // Efficiency
      const totalLots = platformStats.reduce((sum, p) => sum + p.lotsTraded, 0);
      const avgCostPerLot = totalLots > 0 ? totalCost / totalLots : 0;
      
      const platformsWithLots = platformStats.filter(p => p.lotsTraded > 0);
      const mostEfficientPlatform = platformsWithLots.length > 0
        ? platformsWithLots.reduce((a, b) => a.costPerLot < b.costPerLot ? a : b).name
        : '-';

      return {
        totalPlatforms,
        totalCost,
        avgMonthlyCost,
        mostContractedPlatform,
        highestCostPlatform,
        momGrowth,
        platformStats,
        stateStats,
        partnerStats,
        monthlyEvolution,
        topClientsByCost,
        multiPlatformClients,
        multiPlatformClientsPercent,
        topPlatformConcentration,
        newContractsThisMonth,
        adoptionTrend,
        assessorStats,
        avgCostPerLot,
        mostEfficientPlatform,
      };
    },
  });
}
