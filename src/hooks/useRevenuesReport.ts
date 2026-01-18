import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RevenuesReportData {
  // Summary totals
  totalGross: number;
  totalTaxes: number;
  totalGenial: number;
  totalZeve: number;
  
  // Additional metrics
  averageTicket: number;
  revenuePerClient: number;
  momGrowth: number;
  activeClientsCount: number;
  
  // Monthly evolution
  monthlyEvolution: {
    month: string;
    monthKey: string;
    gross: number;
    taxes: number;
    genial: number;
    zeve: number;
  }[];
  
  // MRR Components
  mrrComponents: {
    month: string;
    novo: number;
    expansao: number;
    contracao: number;
    churn: number;
  }[];
  
  // Revenue by partner
  revenueByPartner: { partner: string; value: number }[];
  
  // Revenue by assessor
  revenueByAssessor: { assessor: string; value: number }[];
  
  // Revenue by product with monthly data
  revenueByProduct: {
    product: string;
    productId: string;
    value: number;
    monthlyData: { month: string; value: number }[];
    topClients: { name: string; value: number; id: string }[];
  }[];
  
  // Top 10 clients by revenue
  topClients: { name: string; value: number; id: string; percentage: number }[];

  // Available months for comparison
  availableMonths: { key: string; label: string }[];
}

interface RevenuesReportOptions {
  months?: number;
  startDate?: string;
  endDate?: string;
}

// Helper function to fetch all revenues in batches (overcomes 1000 row limit)
async function fetchAllRevenues(startDateStr: string): Promise<any[]> {
  const allRevenues: any[] = [];
  const batchSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('revenues')
      .select('*, product:products(id, name), client:clients(id, name, assessor_id, partner:partners(name))')
      .gte('date', startDateStr)
      .order('date', { ascending: true })
      .range(from, from + batchSize - 1);

    if (error) throw error;
    
    if (data && data.length > 0) {
      allRevenues.push(...data);
      from += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }

  return allRevenues;
}

export function useRevenuesReport(options: RevenuesReportOptions | number = 12) {
  // Handle both old API (just months number) and new API (options object)
  const months = typeof options === 'number' ? options : (options.months || 12);
  const customStartDate = typeof options === 'object' ? options.startDate : undefined;
  const customEndDate = typeof options === 'object' ? options.endDate : undefined;

  return useQuery({
    queryKey: ['revenuesReport', months, customStartDate, customEndDate],
    queryFn: async (): Promise<RevenuesReportData> => {
      const now = new Date();
      
      let startDate: Date;
      let endDate: Date;
      let previousStartDate: Date;
      
      if (customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        // For custom period, previous period is the same length before start
        const periodLength = endDate.getTime() - startDate.getTime();
        previousStartDate = new Date(startDate.getTime() - periodLength);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of current month
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
      }
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      const previousStartDateStr = previousStartDate.toISOString().split('T')[0];
      
      // Fetch all revenues using batch fetching
      const allRevenues = await fetchAllRevenues(previousStartDateStr);
      
      // Fetch profiles for assessor names
      const { data: profiles } = await supabase.from('profiles').select('user_id, name');
      
      // Filter revenues for current period
      const currentRevenues = allRevenues.filter(r => r.date >= startDateStr && r.date <= endDateStr);
      const previousRevenues = allRevenues.filter(r => r.date < startDateStr);
      
      // Summary totals
      const totalGross = currentRevenues.reduce((sum, r) => sum + Number(r.gross_revenue || 0), 0);
      const totalTaxes = currentRevenues.reduce((sum, r) => sum + Number(r.taxes || 0), 0);
      const totalGenial = currentRevenues.reduce((sum, r) => sum + Number(r.bank_share || 0), 0);
      const totalZeve = currentRevenues.reduce((sum, r) => sum + Number(r.our_share || 0), 0);
      
      // Active clients (clients with revenue in period)
      const activeClientIds = new Set(currentRevenues.map(r => r.client_id).filter(Boolean));
      const activeClientsCount = activeClientIds.size;
      
      // Average ticket & revenue per client
      const averageTicket = currentRevenues.length > 0 ? totalGross / currentRevenues.length : 0;
      const revenuePerClient = activeClientsCount > 0 ? totalZeve / activeClientsCount : 0;
      
      // MoM Growth (compare last month with previous)
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthKey = lastMonth.toISOString().slice(0, 7);
      const prevMonthKey = prevMonth.toISOString().slice(0, 7);
      
      const lastMonthRevenue = currentRevenues
        .filter(r => r.date.startsWith(lastMonthKey))
        .reduce((sum, r) => sum + Number(r.our_share || 0), 0);
      
      const prevMonthRevenue = currentRevenues
        .filter(r => r.date.startsWith(prevMonthKey))
        .reduce((sum, r) => sum + Number(r.our_share || 0), 0);
      
      const momGrowth = prevMonthRevenue > 0 
        ? ((lastMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
        : 0;
      
      // Monthly evolution
      const monthlyMap = new Map<string, { gross: number; taxes: number; genial: number; zeve: number }>();
      
      currentRevenues.forEach(r => {
        const monthKey = r.date.slice(0, 7);
        const existing = monthlyMap.get(monthKey) || { gross: 0, taxes: 0, genial: 0, zeve: 0 };
        existing.gross += Number(r.gross_revenue || 0);
        existing.taxes += Number(r.taxes || 0);
        existing.genial += Number(r.bank_share || 0);
        existing.zeve += Number(r.our_share || 0);
        monthlyMap.set(monthKey, existing);
      });
      
      // Build monthly evolution based on period type
      const monthlyEvolution: RevenuesReportData['monthlyEvolution'] = [];
      const monthSet = new Set<string>();
      
      if (customStartDate && customEndDate) {
        // For custom period, iterate through actual months in range
        const current = new Date(startDate);
        while (current <= endDate) {
          const monthKey = current.toISOString().slice(0, 7);
          monthSet.add(monthKey);
          const monthLabel = current.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          const data = monthlyMap.get(monthKey) || { gross: 0, taxes: 0, genial: 0, zeve: 0 };
          monthlyEvolution.push({ month: monthLabel, monthKey, ...data });
          current.setMonth(current.getMonth() + 1);
        }
      } else {
        // For preset period, iterate from months ago to now
        for (let i = months - 1; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = date.toISOString().slice(0, 7);
          monthSet.add(monthKey);
          const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          const data = monthlyMap.get(monthKey) || { gross: 0, taxes: 0, genial: 0, zeve: 0 };
          monthlyEvolution.push({ month: monthLabel, monthKey, ...data });
        }
      }

      // Build available months for comparison (from all revenues)
      const allMonthKeys = new Set<string>();
      allRevenues.forEach(r => {
        allMonthKeys.add(r.date.slice(0, 7));
      });
      const availableMonths = Array.from(allMonthKeys)
        .sort()
        .map(key => {
          const [year, month] = key.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, 1);
          return {
            key,
            label: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          };
        });
      
      // MRR Components calculation
      const clientMonthlyRevenue = new Map<string, Map<string, number>>();
      
      [...previousRevenues, ...currentRevenues].forEach(r => {
        if (!r.client_id) return;
        const monthKey = r.date.slice(0, 7);
        if (!clientMonthlyRevenue.has(r.client_id)) {
          clientMonthlyRevenue.set(r.client_id, new Map());
        }
        const clientMap = clientMonthlyRevenue.get(r.client_id)!;
        clientMap.set(monthKey, (clientMap.get(monthKey) || 0) + Number(r.our_share || 0));
      });
      
      const mrrComponents: RevenuesReportData['mrrComponents'] = [];
      const monthlyEvolutionKeys = monthlyEvolution.map(m => m.monthKey);
      
      monthlyEvolutionKeys.forEach((monthKey, idx) => {
        const prevMonthKeyMRR = idx > 0 ? monthlyEvolutionKeys[idx - 1] : null;
        const monthLabel = monthlyEvolution[idx].month;
        
        let novo = 0, expansao = 0, contracao = 0, churn = 0;
        
        if (prevMonthKeyMRR) {
          clientMonthlyRevenue.forEach((clientMap) => {
            const currentValue = clientMap.get(monthKey) || 0;
            const prevValue = clientMap.get(prevMonthKeyMRR) || 0;
            
            if (currentValue > 0 && prevValue === 0) {
              novo += currentValue;
            } else if (currentValue > prevValue && prevValue > 0) {
              expansao += (currentValue - prevValue);
            } else if (currentValue < prevValue && currentValue > 0) {
              contracao += (prevValue - currentValue);
            } else if (currentValue === 0 && prevValue > 0) {
              churn += prevValue;
            }
          });
        }
        
        mrrComponents.push({ month: monthLabel, novo, expansao, contracao: -contracao, churn: -churn });
      });
      
      // Revenue by partner
      const partnerMap = new Map<string, number>();
      currentRevenues.forEach(r => {
        const partnerName = r.client?.partner?.name || 'Sem parceiro';
        partnerMap.set(partnerName, (partnerMap.get(partnerName) || 0) + Number(r.our_share || 0));
      });
      
      const revenueByPartner = Array.from(partnerMap.entries())
        .map(([partner, value]) => ({ partner, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      
      // Revenue by assessor (via client)
      const assessorMap = new Map<string, number>();
      const profilesMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);
      
      currentRevenues.forEach(r => {
        if (!r.client?.assessor_id) return;
        const assessorName = profilesMap.get(r.client.assessor_id) || 'Não atribuído';
        assessorMap.set(assessorName, (assessorMap.get(assessorName) || 0) + Number(r.our_share || 0));
      });
      
      const revenueByAssessor = Array.from(assessorMap.entries())
        .map(([assessor, value]) => ({ assessor, value }))
        .sort((a, b) => b.value - a.value);
      
      // Revenue by product with monthly data
      const productMap = new Map<string, { 
        productId: string; 
        value: number; 
        monthlyData: Map<string, number>;
        clientRevenue: Map<string, { name: string; value: number; id: string }>;
      }>();
      
      currentRevenues.forEach(r => {
        if (!r.product?.name) return;
        const productName = r.product.name;
        const productId = r.product.id;
        const monthKey = r.date.slice(0, 7);
        
        if (!productMap.has(productName)) {
          productMap.set(productName, { 
            productId, 
            value: 0, 
            monthlyData: new Map(),
            clientRevenue: new Map(),
          });
        }
        
        const product = productMap.get(productName)!;
        product.value += Number(r.our_share || 0);
        product.monthlyData.set(monthKey, (product.monthlyData.get(monthKey) || 0) + Number(r.our_share || 0));
        
        if (r.client_id && r.client?.name) {
          const existing = product.clientRevenue.get(r.client_id) || { 
            name: r.client.name, 
            value: 0, 
            id: r.client_id 
          };
          existing.value += Number(r.our_share || 0);
          product.clientRevenue.set(r.client_id, existing);
        }
      });
      
      const revenueByProduct = Array.from(productMap.entries())
        .map(([product, data]) => {
          // Build monthly data array
          const monthlyData: { month: string; value: number }[] = [];
          monthlyEvolution.forEach(m => {
            monthlyData.push({ month: m.month, value: data.monthlyData.get(m.monthKey) || 0 });
          });
          
          // Get top clients for this product
          const topClients = Array.from(data.clientRevenue.values())
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
          
          return {
            product,
            productId: data.productId,
            value: data.value,
            monthlyData,
            topClients,
          };
        })
        .sort((a, b) => b.value - a.value);
      
      // Top 10 clients by revenue
      const clientMap = new Map<string, { name: string; value: number; id: string }>();
      currentRevenues.forEach(r => {
        if (!r.client_id || !r.client?.name) return;
        const existing = clientMap.get(r.client_id) || { name: r.client.name, value: 0, id: r.client_id };
        existing.value += Number(r.our_share || 0);
        clientMap.set(r.client_id, existing);
      });
      
      const topClients = Array.from(clientMap.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
        .map(c => ({ ...c, percentage: totalZeve > 0 ? (c.value / totalZeve) * 100 : 0 }));
      
      return {
        totalGross,
        totalTaxes,
        totalGenial,
        totalZeve,
        averageTicket,
        revenuePerClient,
        momGrowth,
        activeClientsCount,
        monthlyEvolution,
        mrrComponents,
        revenueByPartner,
        revenueByAssessor,
        revenueByProduct,
        topClients,
        availableMonths,
      };
    },
  });
}

// Helper function to fetch all revenues for a specific period with batch fetching
async function fetchRevenuesForPeriod(startDate: string, endDate: string): Promise<any[]> {
  const allRevenues: any[] = [];
  const batchSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('revenues')
      .select('*, client:clients(id)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .range(from, from + batchSize - 1);

    if (error) throw error;
    
    if (data && data.length > 0) {
      allRevenues.push(...data);
      from += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }

  return allRevenues;
}

// Helper hook for month comparison
export function useMonthComparison(month1: string | null, month2: string | null) {
  return useQuery({
    queryKey: ['monthComparison', month1, month2],
    enabled: !!month1 && !!month2,
    queryFn: async () => {
      if (!month1 || !month2) return null;

      const [month1Start, month1End] = getMonthRange(month1);
      const [month2Start, month2End] = getMonthRange(month2);

      // Fetch all revenues for both months using batch fetching
      const [revenues1, revenues2] = await Promise.all([
        fetchRevenuesForPeriod(month1Start, month1End),
        fetchRevenuesForPeriod(month2Start, month2End),
      ]);

      const calcMetrics = (revenues: any[]) => ({
        gross: revenues.reduce((sum, r) => sum + Number(r.gross_revenue || 0), 0),
        taxes: revenues.reduce((sum, r) => sum + Number(r.taxes || 0), 0),
        genial: revenues.reduce((sum, r) => sum + Number(r.bank_share || 0), 0),
        zeve: revenues.reduce((sum, r) => sum + Number(r.our_share || 0), 0),
        clients: new Set(revenues.map(r => r.client_id).filter(Boolean)).size,
        transactions: revenues.length,
      });

      const metrics1 = calcMetrics(revenues1);
      const metrics2 = calcMetrics(revenues2);

      const calcVariation = (v1: number, v2: number) => ({
        absolute: v2 - v1,
        percent: v1 > 0 ? ((v2 - v1) / v1) * 100 : 0,
      });

      return {
        month1: { key: month1, metrics: metrics1 },
        month2: { key: month2, metrics: metrics2 },
        variation: {
          gross: calcVariation(metrics1.gross, metrics2.gross),
          taxes: calcVariation(metrics1.taxes, metrics2.taxes),
          genial: calcVariation(metrics1.genial, metrics2.genial),
          zeve: calcVariation(metrics1.zeve, metrics2.zeve),
          clients: calcVariation(metrics1.clients, metrics2.clients),
          transactions: calcVariation(metrics1.transactions, metrics2.transactions),
        },
      };
    },
  });
}

function getMonthRange(monthKey: string): [string, string] {
  const [year, month] = monthKey.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  return [
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0],
  ];
}
