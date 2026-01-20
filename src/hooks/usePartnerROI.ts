import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PartnerROI {
  partnerId: string;
  clientCount: number;
  totalRevenue: number;
  totalPatrimony: number;
  clients: {
    id: string;
    name: string;
    totalRevenue: number;
    lastRevenue?: string;
  }[];
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
      .select('id, name, partner_id, patrimony, active')
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

async function fetchAllRevenues() {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('revenues')
      .select('client_id, our_share, date')
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

export function usePartnerROI() {
  return useQuery({
    queryKey: ['partnerROI'],
    queryFn: async () => {
      // Fetch ALL clients with partner_id (paginated internally)
      const clients = await fetchAllClients();

      // Fetch ALL revenues (paginated internally)
      const revenues = await fetchAllRevenues();

      // Group data by partner
      const roiByPartner: Record<string, PartnerROI> = {};

      clients?.forEach(client => {
        if (!client.partner_id) return;

        if (!roiByPartner[client.partner_id]) {
          roiByPartner[client.partner_id] = {
            partnerId: client.partner_id,
            clientCount: 0,
            totalRevenue: 0,
            totalPatrimony: 0,
            clients: [],
          };
        }

        const clientRevenues = revenues?.filter(r => r.client_id === client.id) || [];
        const clientTotalRevenue = clientRevenues.reduce((sum, r) => sum + Number(r.our_share), 0);
        const lastRevenue = clientRevenues[0]?.date;

        roiByPartner[client.partner_id].clientCount += 1;
        roiByPartner[client.partner_id].totalRevenue += clientTotalRevenue;
        roiByPartner[client.partner_id].totalPatrimony += Number(client.patrimony) || 0;
        roiByPartner[client.partner_id].clients.push({
          id: client.id,
          name: client.name,
          totalRevenue: clientTotalRevenue,
          lastRevenue,
        });
      });

      return Object.values(roiByPartner);
    },
  });
}

export function usePartnerDetail(partnerId: string | null) {
  return useQuery({
    queryKey: ['partnerDetail', partnerId],
    queryFn: async () => {
      if (!partnerId) return null;

      // Get partner
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (partnerError) throw partnerError;

      // Get clients for this partner (paginated)
      const PAGE_SIZE = 1000;
      let allClients: any[] = [];
      let clientPage = 0;
      let hasMoreClients = true;

      while (hasMoreClients) {
        const from = clientPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabase
          .from('clients')
          .select('id, name, type, patrimony, active, created_at')
          .eq('partner_id', partnerId)
          .order('name')
          .range(from, to);

        if (error) throw error;

        if (data && data.length > 0) {
          allClients = [...allClients, ...data];
          hasMoreClients = data.length === PAGE_SIZE;
          clientPage++;
        } else {
          hasMoreClients = false;
        }
      }

      const clients = allClients;

      // Get revenues for all clients (in chunks to avoid URL length limit)
      const clientIds = clients?.map(c => c.id) || [];
      
      let allRevenues: any[] = [];
      
      if (clientIds.length > 0) {
        // Dividir clientIds em chunks de 50 para evitar URL muito longa
        const CHUNK_SIZE = 50;
        const chunks: string[][] = [];
        
        for (let i = 0; i < clientIds.length; i += CHUNK_SIZE) {
          chunks.push(clientIds.slice(i, i + CHUNK_SIZE));
        }

        // Processar cada chunk
        for (const chunk of chunks) {
          let revenuePage = 0;
          let hasMoreRevenues = true;

          while (hasMoreRevenues) {
            const from = revenuePage * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error } = await supabase
              .from('revenues')
              .select('client_id, our_share, date')
              .in('client_id', chunk)
              .order('date', { ascending: false })
              .range(from, to);

            if (error) throw error;

            if (data && data.length > 0) {
              allRevenues = [...allRevenues, ...data];
              hasMoreRevenues = data.length === PAGE_SIZE;
              revenuePage++;
            } else {
              hasMoreRevenues = false;
            }
          }
        }
      }

      const revenues = allRevenues;

      // Get paid commissions for this partner
      const { data: paidCommissionsData, error: commissionsError } = await supabase
        .from('partner_commissions')
        .select('amount')
        .eq('partner_id', partnerId)
        .eq('status', 'paid');

      if (commissionsError) throw commissionsError;

      const totalPaidCommission = paidCommissionsData?.reduce(
        (sum, c) => sum + Number(c.amount), 0
      ) || 0;

      // Calculate metrics
      const clientsWithMetrics = clients?.map(client => {
        const clientRevenues = revenues?.filter(r => r.client_id === client.id) || [];
        const totalRevenue = clientRevenues.reduce((sum, r) => sum + Number(r.our_share), 0);
        const lastRevenue = clientRevenues[0]?.date;

        return {
          ...client,
          totalRevenue,
          lastRevenue,
        };
      }) || [];

      const totalRevenue = clientsWithMetrics.reduce((sum, c) => sum + c.totalRevenue, 0);
      const totalPatrimony = clientsWithMetrics.reduce((sum, c) => sum + (Number(c.patrimony) || 0), 0);
      const roi = totalPaidCommission > 0 ? totalRevenue / totalPaidCommission : 0;

      // Revenue by month (last 12 months)
      const revenueByMonth: Record<string, number> = {};
      revenues?.forEach(r => {
        const month = r.date.slice(0, 7);
        revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(r.our_share);
      });

      return {
        partner,
        clients: clientsWithMetrics,
        metrics: {
          clientCount: clients?.length || 0,
          activeClients: clients?.filter(c => c.active).length || 0,
          totalRevenue,
          totalPatrimony,
          paidCommission: totalPaidCommission,
          roi,
          avgRevenuePerClient: clients?.length ? totalRevenue / clients.length : 0,
        },
        revenueByMonth: Object.entries(revenueByMonth)
          .map(([month, value]) => ({ month, value }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-12),
      };
    },
    enabled: !!partnerId,
  });
}
