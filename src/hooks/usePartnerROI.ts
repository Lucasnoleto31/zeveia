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

export function usePartnerROI() {
  return useQuery({
    queryKey: ['partnerROI'],
    queryFn: async () => {
      // Get all clients with their partner_id and revenues
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          partner_id,
          patrimony,
          active
        `)
        .not('partner_id', 'is', null);

      if (clientsError) throw clientsError;

      // Get revenues for all clients
      const { data: revenues, error: revenuesError } = await supabase
        .from('revenues')
        .select('client_id, our_share, date')
        .order('date', { ascending: false });

      if (revenuesError) throw revenuesError;

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

      // Get clients for this partner
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          type,
          patrimony,
          active,
          created_at
        `)
        .eq('partner_id', partnerId)
        .order('name');

      if (clientsError) throw clientsError;

      // Get revenues for all clients
      const clientIds = clients?.map(c => c.id) || [];
      
      const { data: revenues, error: revenuesError } = await supabase
        .from('revenues')
        .select('client_id, our_share, date')
        .in('client_id', clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000'])
        .order('date', { ascending: false });

      if (revenuesError) throw revenuesError;

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
      const estimatedCommission = totalRevenue * (partner.commission_percentage / 100);

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
          estimatedCommission,
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
