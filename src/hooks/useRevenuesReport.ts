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
}

export function useRevenuesReport(months: number = 12) {
  return useQuery({
    queryKey: ['revenuesReport', months],
    queryFn: async (): Promise<RevenuesReportData> => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
      const previousStartDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
      const startDateStr = startDate.toISOString().split('T')[0];
      const previousStartDateStr = previousStartDate.toISOString().split('T')[0];
      
      // Fetch revenues with all relations
      const { data: revenues, error: revenuesError } = await supabase
        .from('revenues')
        .select('*, product:products(id, name), client:clients(id, name, assessor_id, partner:partners(name))')
        .gte('date', previousStartDateStr);
      
      if (revenuesError) throw revenuesError;
      
      // Fetch profiles for assessor names
      const { data: profiles } = await supabase.from('profiles').select('user_id, name');
      
      // Filter revenues for current period
      const currentRevenues = revenues?.filter(r => r.date >= startDateStr) || [];
      const previousRevenues = revenues?.filter(r => r.date < startDateStr) || [];
      
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
      
      const monthlyEvolution: RevenuesReportData['monthlyEvolution'] = [];
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7);
        const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        const data = monthlyMap.get(monthKey) || { gross: 0, taxes: 0, genial: 0, zeve: 0 };
        monthlyEvolution.push({ month: monthLabel, ...data });
      }
      
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
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7);
        const prevMonthDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
        const prevMonthKey = prevMonthDate.toISOString().slice(0, 7);
        const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        
        let novo = 0, expansao = 0, contracao = 0, churn = 0;
        
        clientMonthlyRevenue.forEach((clientMap, clientId) => {
          const currentValue = clientMap.get(monthKey) || 0;
          const prevValue = clientMap.get(prevMonthKey) || 0;
          
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
        
        mrrComponents.push({ month: monthLabel, novo, expansao, contracao: -contracao, churn: -churn });
      }
      
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
          for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toISOString().slice(0, 7);
            const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            monthlyData.push({ month: monthLabel, value: data.monthlyData.get(monthKey) || 0 });
          }
          
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
      };
    },
  });
}
