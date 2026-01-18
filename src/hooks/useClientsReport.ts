import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ClientRanking {
  id: string;
  name: string;
  value: number;
}

interface ClientsReportData {
  // Summary metrics
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  totalPatrimony: number;
  averageLTV: number;
  inactivityRate: number;
  
  // Patrimony by profile
  patrimonyByProfile: { profile: string; value: number; count: number }[];
  
  // Clients by state
  clientsByState: { state: string; count: number }[];
  
  // Average monthly contract volume (last 12 months)
  avgContractVolume: { month: string; volume: number }[];
  
  // Active clients by month
  activeClientsByMonth: { month: string; count: number }[];
  
  // Clients by partner
  clientsByPartner: { partner: string; count: number }[];
  
  // PF vs PJ distribution
  typeDistribution: { type: string; count: number; percentage: number }[];
  
  // ABC curve
  abcCurve: { 
    aClients: number; 
    aPercentage: number; 
    aRevenue: number;
    bClients: number;
    bPercentage: number;
    bRevenue: number;
    cClients: number;
    cPercentage: number;
    cRevenue: number;
  };
  
  // Product penetration
  productPenetration: { product: string; clients: number; percentage: number }[];
  
  // Top 10 Rankings
  topByPatrimony: ClientRanking[];
  topByRevenue: ClientRanking[];
  topByContracts: ClientRanking[];
  topByZeroed: ClientRanking[];
}

// Helper function to fetch all records with pagination
async function fetchAllClients() {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('clients')
      .select('*, partner:partners(name)')
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
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('revenues')
      .select('*, product:products(name)')
      .gte('date', startDateStr)
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

async function fetchAllContracts(startDateStr: string) {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .gte('date', startDateStr)
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

export interface ClientsReportOptions {
  months?: number;
  startDate?: string;
  endDate?: string;
}

export function useClientsReport(options: ClientsReportOptions | number = 12) {
  const opts = typeof options === 'number' ? { months: options } : options;
  const { months = 12, startDate: customStartDate, endDate: customEndDate } = opts;

  return useQuery({
    queryKey: ['clientsReport', months, customStartDate, customEndDate],
    queryFn: async (): Promise<ClientsReportData> => {
      const now = new Date();
      let startDateStr: string;
      let endDateStr: string | undefined;

      if (customStartDate && customEndDate) {
        startDateStr = customStartDate;
        endDateStr = customEndDate;
      } else {
        const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
        startDateStr = startDate.toISOString().split('T')[0];
      }
      
      // Fetch all clients with pagination
      const clients = await fetchAllClients();
      
      // Fetch all revenues in period with pagination
      const revenues = await fetchAllRevenues(startDateStr);
      
      // Fetch all contracts in period with pagination
      const contracts = await fetchAllContracts(startDateStr);
      
      // Calculate inactivity (60 days without revenue)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const clientLastRevenue = new Map<string, Date>();
      revenues?.forEach(r => {
        if (r.client_id) {
          const current = clientLastRevenue.get(r.client_id);
          const revenueDate = new Date(r.date);
          if (!current || revenueDate > current) {
            clientLastRevenue.set(r.client_id, revenueDate);
          }
        }
      });
      
      let inactiveCount = 0;
      clients?.forEach(c => {
        const lastRevenue = clientLastRevenue.get(c.id);
        if (!lastRevenue || lastRevenue < sixtyDaysAgo) {
          inactiveCount++;
        }
      });
      
      // Summary metrics
      const totalClients = clients?.length || 0;
      const activeClients = clients?.filter(c => c.active).length || 0;
      const inactiveClients = totalClients - activeClients;
      const totalPatrimony = clients?.reduce((sum, c) => sum + Number(c.patrimony || 0), 0) || 0;
      const totalRevenue = revenues?.reduce((sum, r) => sum + Number(r.our_share || 0), 0) || 0;
      const averageLTV = totalClients > 0 ? totalRevenue / totalClients : 0;
      const inactivityRate = totalClients > 0 ? (inactiveCount / totalClients) * 100 : 0;
      
      // Patrimony by profile
      const profileMap = new Map<string, { value: number; count: number }>();
      const profileLabels: Record<string, string> = {
        conservador: 'Conservador',
        moderado: 'Moderado',
        arrojado: 'Arrojado',
        agressivo: 'Agressivo',
      };
      
      clients?.forEach(c => {
        const profile = c.profile || 'Não definido';
        const label = profileLabels[profile] || profile;
        const existing = profileMap.get(label) || { value: 0, count: 0 };
        existing.value += Number(c.patrimony || 0);
        existing.count += 1;
        profileMap.set(label, existing);
      });
      
      const patrimonyByProfile = Array.from(profileMap.entries())
        .map(([profile, data]) => ({ profile, ...data }))
        .sort((a, b) => b.value - a.value);
      
      // Clients by state
      const stateMap = new Map<string, number>();
      clients?.forEach(c => {
        if (c.state) {
          stateMap.set(c.state, (stateMap.get(c.state) || 0) + 1);
        }
      });
      
      const clientsByState = Array.from(stateMap.entries())
        .map(([state, count]) => ({ state, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // Average monthly contract volume
      const contractVolumeMap = new Map<string, number[]>();
      contracts?.forEach(c => {
        const monthKey = c.date.slice(0, 7);
        const existing = contractVolumeMap.get(monthKey) || [];
        existing.push(c.lots_traded);
        contractVolumeMap.set(monthKey, existing);
      });
      
      const avgContractVolume: { month: string; volume: number }[] = [];
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7);
        const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' });
        const lots = contractVolumeMap.get(monthKey) || [];
        const avgVolume = lots.length > 0 ? lots.reduce((a, b) => a + b, 0) / lots.length : 0;
        avgContractVolume.push({ month: monthLabel, volume: Math.round(avgVolume) });
      }
      
      // Active clients by month (clients with revenue in that month)
      const activeByMonthMap = new Map<string, Set<string>>();
      revenues?.forEach(r => {
        if (r.client_id) {
          const monthKey = r.date.slice(0, 7);
          const existing = activeByMonthMap.get(monthKey) || new Set();
          existing.add(r.client_id);
          activeByMonthMap.set(monthKey, existing);
        }
      });
      
      const activeClientsByMonth: { month: string; count: number }[] = [];
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7);
        const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' });
        const clientSet = activeByMonthMap.get(monthKey) || new Set();
        activeClientsByMonth.push({ month: monthLabel, count: clientSet.size });
      }
      
      // Clients by partner
      const partnerMap = new Map<string, number>();
      clients?.forEach(c => {
        const partnerName = c.partner?.name || 'Sem parceiro';
        partnerMap.set(partnerName, (partnerMap.get(partnerName) || 0) + 1);
      });
      
      const clientsByPartner = Array.from(partnerMap.entries())
        .map(([partner, count]) => ({ partner, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // PF vs PJ distribution
      const pfCount = clients?.filter(c => c.type === 'pf').length || 0;
      const pjCount = clients?.filter(c => c.type === 'pj').length || 0;
      const typeDistribution = [
        { type: 'Pessoa Física', count: pfCount, percentage: totalClients > 0 ? (pfCount / totalClients) * 100 : 0 },
        { type: 'Pessoa Jurídica', count: pjCount, percentage: totalClients > 0 ? (pjCount / totalClients) * 100 : 0 },
      ];
      
      // ABC Curve (revenue concentration)
      const clientRevenueMap = new Map<string, number>();
      revenues?.forEach(r => {
        if (r.client_id) {
          clientRevenueMap.set(r.client_id, (clientRevenueMap.get(r.client_id) || 0) + Number(r.our_share || 0));
        }
      });
      
      const sortedClientRevenues = Array.from(clientRevenueMap.entries())
        .sort((a, b) => b[1] - a[1]);
      
      let cumulativeRevenue = 0;
      let aClients = 0, bClients = 0, cClients = 0;
      let aRevenue = 0, bRevenue = 0, cRevenue = 0;
      
      sortedClientRevenues.forEach(([_, revenue]) => {
        const percentage = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 0;
        
        if (percentage < 80) {
          aClients++;
          aRevenue += revenue;
        } else if (percentage < 95) {
          bClients++;
          bRevenue += revenue;
        } else {
          cClients++;
          cRevenue += revenue;
        }
        
        cumulativeRevenue += revenue;
      });
      
      const abcCurve = {
        aClients,
        aPercentage: totalClients > 0 ? (aClients / totalClients) * 100 : 0,
        aRevenue,
        bClients,
        bPercentage: totalClients > 0 ? (bClients / totalClients) * 100 : 0,
        bRevenue,
        cClients,
        cPercentage: totalClients > 0 ? (cClients / totalClients) * 100 : 0,
        cRevenue,
      };
      
      // Product penetration
      const productClientMap = new Map<string, Set<string>>();
      revenues?.forEach(r => {
        if (r.client_id && r.product?.name) {
          const existing = productClientMap.get(r.product.name) || new Set();
          existing.add(r.client_id);
          productClientMap.set(r.product.name, existing);
        }
      });
      
      const productPenetration = Array.from(productClientMap.entries())
        .map(([product, clientSet]) => ({
          product,
          clients: clientSet.size,
          percentage: totalClients > 0 ? (clientSet.size / totalClients) * 100 : 0,
        }))
        .sort((a, b) => b.percentage - a.percentage);
      
      // Top 10 Rankings
      // By Patrimony
      const topByPatrimony: ClientRanking[] = (clients || [])
        .filter(c => c.active && c.patrimony)
        .sort((a, b) => Number(b.patrimony || 0) - Number(a.patrimony || 0))
        .slice(0, 10)
        .map(c => ({ id: c.id, name: c.name, value: Number(c.patrimony || 0) }));
      
      // By Revenue (using clientRevenueMap from ABC calculation)
      const topByRevenue: ClientRanking[] = sortedClientRevenues
        .slice(0, 10)
        .map(([clientId, revenue]) => {
          const client = clients?.find(c => c.id === clientId);
          return { id: clientId, name: client?.name || 'Desconhecido', value: revenue };
        });
      
      // By Contracts (lots traded)
      const clientContractsMap = new Map<string, number>();
      contracts?.forEach(c => {
        if (c.client_id) {
          clientContractsMap.set(c.client_id, (clientContractsMap.get(c.client_id) || 0) + (c.lots_traded || 0));
        }
      });
      
      const topByContracts: ClientRanking[] = Array.from(clientContractsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([clientId, lots]) => {
          const client = clients?.find(c => c.id === clientId);
          return { id: clientId, name: client?.name || 'Desconhecido', value: lots };
        });
      
      // By Zeroed (lots zeroed)
      const clientZeroedMap = new Map<string, number>();
      contracts?.forEach(c => {
        if (c.client_id) {
          clientZeroedMap.set(c.client_id, (clientZeroedMap.get(c.client_id) || 0) + (c.lots_zeroed || 0));
        }
      });
      
      const topByZeroed: ClientRanking[] = Array.from(clientZeroedMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([clientId, lots]) => {
          const client = clients?.find(c => c.id === clientId);
          return { id: clientId, name: client?.name || 'Desconhecido', value: lots };
        });
      
      return {
        totalClients,
        activeClients,
        inactiveClients,
        totalPatrimony,
        averageLTV,
        inactivityRate,
        patrimonyByProfile,
        clientsByState,
        avgContractVolume,
        activeClientsByMonth,
        clientsByPartner,
        typeDistribution,
        abcCurve,
        productPenetration,
        topByPatrimony,
        topByRevenue,
        topByContracts,
        topByZeroed,
      };
    },
  });
}
