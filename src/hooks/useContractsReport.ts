import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ClientRanking {
  id: string;
  name: string;
  value: number;
}

interface MonthlyData {
  month: string;
  traded: number;
  zeroed: number;
  zeroRate: number;
}

interface AggregatedData {
  name: string;
  traded: number;
  zeroed: number;
  zeroRate: number;
}

interface VolumeDistribution {
  range: string;
  count: number;
  percentage: number;
}

interface InactiveClient {
  id: string;
  name: string;
  daysSinceLastOp: number;
  lastOpDate: string;
  totalTraded: number;
}

export interface ContractsReportData {
  // Summary
  totalTraded: number;
  totalZeroed: number;
  zeroRate: number;
  totalRecords: number;
  avgLotsPerClient: number;
  activeClientsCount: number;
  momGrowth: number;

  // New metrics
  top10Concentration: number; // % of total volume from top 10 clients
  volumeDistribution: VolumeDistribution[];
  inactiveClients: InactiveClient[];

  // Monthly Evolution
  monthlyEvolution: MonthlyData[];

  // Aggregations
  byPartner: AggregatedData[];
  byPlatform: AggregatedData[];
  byAsset: AggregatedData[];
  byState: AggregatedData[];
  byAssessor: AggregatedData[];

  // Rankings
  topByTraded: ClientRanking[];
  topByZeroed: ClientRanking[];
  topByBestRate: ClientRanking[];
}

export interface ContractsReportOptions {
  months?: number;
  startDate?: string;
  endDate?: string;
}

// Batch fetch all contracts to overcome Supabase 1000 row limit
async function fetchAllContracts(startDateStr: string, endDateStr?: string) {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('contracts')
      .select(`
        *,
        client:clients(id, name, state, assessor_id, partner:partners(id, name)),
        asset:assets(id, code, name),
        platform:platforms(id, name)
      `)
      .gte('date', startDateStr)
      .range(from, to);

    if (endDateStr) {
      query = query.lte('date', endDateStr);
    }

    const { data, error } = await query;
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

export function useContractsReport(options: ContractsReportOptions | number = 12) {
  const opts = typeof options === 'number' ? { months: options } : options;
  const { months = 12, startDate: customStartDate, endDate: customEndDate } = opts;

  return useQuery({
    queryKey: ['contractsReport', months, customStartDate, customEndDate],
    queryFn: async (): Promise<ContractsReportData> => {
      let startDateStr: string;
      let endDateStr: string | undefined;

      if (customStartDate && customEndDate) {
        startDateStr = customStartDate;
        endDateStr = customEndDate;
      } else {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);
        startDateStr = startDate.toISOString().split('T')[0];
      }

      // Fetch ALL contracts with batch fetching
      const contracts = await fetchAllContracts(startDateStr, endDateStr);

      // Fetch assessor profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name');

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      // Calculate summary
      const totalTraded = contracts?.reduce((sum, c) => sum + (c.lots_traded || 0), 0) || 0;
      const totalZeroed = contracts?.reduce((sum, c) => sum + (c.lots_zeroed || 0), 0) || 0;
      const zeroRate = totalTraded > 0 ? (totalZeroed / totalTraded) * 100 : 0;
      const totalRecords = contracts?.length || 0;

      // Active clients
      const uniqueClients = new Set(contracts?.map(c => c.client_id));
      const activeClientsCount = uniqueClients.size;
      const avgLotsPerClient = activeClientsCount > 0 ? totalTraded / activeClientsCount : 0;

      // Monthly evolution
      const byMonth: Record<string, { traded: number; zeroed: number }> = {};
      contracts?.forEach(c => {
        const month = c.date.slice(0, 7);
        if (!byMonth[month]) byMonth[month] = { traded: 0, zeroed: 0 };
        byMonth[month].traded += c.lots_traded || 0;
        byMonth[month].zeroed += c.lots_zeroed || 0;
      });

      const monthlyEvolution = Object.entries(byMonth)
        .map(([month, data]) => ({
          month,
          traded: data.traded,
          zeroed: data.zeroed,
          zeroRate: data.traded > 0 ? (data.zeroed / data.traded) * 100 : 0,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // MoM Growth
      let momGrowth = 0;
      if (monthlyEvolution.length >= 2) {
        const current = monthlyEvolution[monthlyEvolution.length - 1].traded;
        const previous = monthlyEvolution[monthlyEvolution.length - 2].traded;
        momGrowth = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      }

      // By Partner
      const partnerMap: Record<string, { name: string; traded: number; zeroed: number }> = {};
      contracts?.forEach(c => {
        const partner = c.client?.partner;
        if (partner) {
          if (!partnerMap[partner.id]) {
            partnerMap[partner.id] = { name: partner.name, traded: 0, zeroed: 0 };
          }
          partnerMap[partner.id].traded += c.lots_traded || 0;
          partnerMap[partner.id].zeroed += c.lots_zeroed || 0;
        }
      });
      const byPartner = Object.values(partnerMap)
        .map(p => ({ ...p, zeroRate: p.traded > 0 ? (p.zeroed / p.traded) * 100 : 0 }))
        .sort((a, b) => b.traded - a.traded)
        .slice(0, 10);

      // By Platform
      const platformMap: Record<string, { name: string; traded: number; zeroed: number }> = {};
      contracts?.forEach(c => {
        const platform = c.platform;
        if (platform) {
          if (!platformMap[platform.id]) {
            platformMap[platform.id] = { name: platform.name, traded: 0, zeroed: 0 };
          }
          platformMap[platform.id].traded += c.lots_traded || 0;
          platformMap[platform.id].zeroed += c.lots_zeroed || 0;
        }
      });
      const byPlatform = Object.values(platformMap)
        .map(p => ({ ...p, zeroRate: p.traded > 0 ? (p.zeroed / p.traded) * 100 : 0 }))
        .sort((a, b) => b.traded - a.traded);

      // By Asset
      const assetMap: Record<string, { name: string; traded: number; zeroed: number }> = {};
      contracts?.forEach(c => {
        const asset = c.asset;
        if (asset) {
          const key = asset.code || asset.id;
          if (!assetMap[key]) {
            assetMap[key] = { name: asset.code || asset.name, traded: 0, zeroed: 0 };
          }
          assetMap[key].traded += c.lots_traded || 0;
          assetMap[key].zeroed += c.lots_zeroed || 0;
        }
      });
      const byAsset = Object.values(assetMap)
        .map(p => ({ ...p, zeroRate: p.traded > 0 ? (p.zeroed / p.traded) * 100 : 0 }))
        .sort((a, b) => b.traded - a.traded);

      // By State
      const stateMap: Record<string, { name: string; traded: number; zeroed: number }> = {};
      contracts?.forEach(c => {
        const state = c.client?.state || 'Não informado';
        if (!stateMap[state]) {
          stateMap[state] = { name: state, traded: 0, zeroed: 0 };
        }
        stateMap[state].traded += c.lots_traded || 0;
        stateMap[state].zeroed += c.lots_zeroed || 0;
      });
      const byState = Object.values(stateMap)
        .map(p => ({ ...p, zeroRate: p.traded > 0 ? (p.zeroed / p.traded) * 100 : 0 }))
        .sort((a, b) => b.traded - a.traded)
        .slice(0, 10);

      // By Assessor
      const assessorMap: Record<string, { name: string; traded: number; zeroed: number }> = {};
      contracts?.forEach(c => {
        const assessorId = c.client?.assessor_id;
        if (assessorId) {
          if (!assessorMap[assessorId]) {
            assessorMap[assessorId] = { name: profileMap.get(assessorId) || 'Desconhecido', traded: 0, zeroed: 0 };
          }
          assessorMap[assessorId].traded += c.lots_traded || 0;
          assessorMap[assessorId].zeroed += c.lots_zeroed || 0;
        }
      });
      const byAssessor = Object.values(assessorMap)
        .map(p => ({ ...p, zeroRate: p.traded > 0 ? (p.zeroed / p.traded) * 100 : 0 }))
        .sort((a, b) => b.traded - a.traded);

      // Top clients by traded
      const clientTradedMap: Record<string, { id: string; name: string; traded: number; zeroed: number }> = {};
      contracts?.forEach(c => {
        if (c.client) {
          if (!clientTradedMap[c.client.id]) {
            clientTradedMap[c.client.id] = { id: c.client.id, name: c.client.name, traded: 0, zeroed: 0 };
          }
          clientTradedMap[c.client.id].traded += c.lots_traded || 0;
          clientTradedMap[c.client.id].zeroed += c.lots_zeroed || 0;
        }
      });

      const clientsList = Object.values(clientTradedMap);

      const topByTraded = clientsList
        .sort((a, b) => b.traded - a.traded)
        .slice(0, 10)
        .map(c => ({ id: c.id, name: c.name, value: c.traded }));

      const topByZeroed = clientsList
        .sort((a, b) => b.zeroed - a.zeroed)
        .slice(0, 10)
        .map(c => ({ id: c.id, name: c.name, value: c.zeroed }));

      // Best zero rate (minimum 100 lots traded to qualify)
      const topByBestRate = clientsList
        .filter(c => c.traded >= 100)
        .map(c => ({
          id: c.id,
          name: c.name,
          value: c.traded > 0 ? (c.zeroed / c.traded) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      // Top 10 Concentration - % of total volume from top 10 clients
      const top10Volume = topByTraded.reduce((sum, c) => sum + c.value, 0);
      const top10Concentration = totalTraded > 0 ? (top10Volume / totalTraded) * 100 : 0;

      // Volume Distribution by ranges
      const ranges = [
        { range: '1-100', min: 1, max: 100 },
        { range: '101-500', min: 101, max: 500 },
        { range: '501-1000', min: 501, max: 1000 },
        { range: '1001-5000', min: 1001, max: 5000 },
        { range: '5000+', min: 5001, max: Infinity },
      ];
      
      const volumeDistribution = ranges.map(r => {
        const count = clientsList.filter(c => c.traded >= r.min && c.traded <= r.max).length;
        return {
          range: r.range,
          count,
          percentage: clientsList.length > 0 ? (count / clientsList.length) * 100 : 0,
        };
      });

      // Inactive clients - days since last operation
      const clientLastOpMap: Record<string, { id: string; name: string; lastDate: string; totalTraded: number }> = {};
      contracts?.forEach(c => {
        if (c.client) {
          const existing = clientLastOpMap[c.client.id];
          if (!existing || c.date > existing.lastDate) {
            clientLastOpMap[c.client.id] = {
              id: c.client.id,
              name: c.client.name,
              lastDate: c.date,
              totalTraded: (existing?.totalTraded || 0) + (c.lots_traded || 0),
            };
          } else {
            clientLastOpMap[c.client.id].totalTraded += c.lots_traded || 0;
          }
        }
      });

      const today = new Date();
      const inactiveClients = Object.values(clientLastOpMap)
        .map(c => {
          const lastOpDate = new Date(c.lastDate);
          const diffTime = Math.abs(today.getTime() - lastOpDate.getTime());
          const daysSinceLastOp = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return {
            id: c.id,
            name: c.name,
            daysSinceLastOp,
            lastOpDate: c.lastDate,
            totalTraded: c.totalTraded,
          };
        })
        .filter(c => c.daysSinceLastOp >= 30) // Consider inactive if 30+ days
        .sort((a, b) => b.daysSinceLastOp - a.daysSinceLastOp)
        .slice(0, 10);

      return {
        totalTraded,
        totalZeroed,
        zeroRate,
        totalRecords,
        avgLotsPerClient,
        activeClientsCount,
        momGrowth,
        top10Concentration,
        volumeDistribution,
        inactiveClients,
        monthlyEvolution,
        byPartner,
        byPlatform,
        byAsset,
        byState,
        byAssessor,
        topByTraded,
        topByZeroed,
        topByBestRate,
      };
    },
  });
}
