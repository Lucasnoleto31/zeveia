import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertType } from '@/types/database';

export interface AlertFilters {
  type?: AlertType;
  read?: boolean;
  dismissed?: boolean;
  search?: string;
}

export function useAlerts(filters?: AlertFilters) {
  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: async () => {
      let query = supabase
        .from('alerts')
        .select(`
          *,
          client:clients(*),
          lead:leads(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.read !== undefined) {
        query = query.eq('read', filters.read);
      }
      if (filters?.dismissed !== undefined) {
        query = query.eq('dismissed', filters.dismissed);
      }
      if (filters?.search) {
        query = query.ilike('message', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Alert[];
    },
  });
}

export function useUnreadAlertsCount() {
  return useQuery({
    queryKey: ['alerts', 'unread-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)
        .eq('dismissed', false);
      
      if (error) throw error;
      return count || 0;
    },
  });
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useMarkAllAlertsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useDismissAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('alerts')
        .update({ dismissed: true, read: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

// Generate alerts based on business rules
export function useGenerateAlerts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const alerts: Omit<Alert, 'id' | 'created_at' | 'client' | 'lead'>[] = [];

      // 1. Birthday alerts (next 7 days)
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, birth_date, assessor_id')
        .eq('active', true)
        .not('birth_date', 'is', null);

      if (clients) {
        for (const client of clients) {
          if (!client.birth_date) continue;
          
          // Parse birth date correctly (YYYY-MM-DD format)
          const [year, month, day] = client.birth_date.split('-').map(Number);
          
          // Create this year's birthday
          let thisYearBirthday = new Date(today.getFullYear(), month - 1, day);
          thisYearBirthday.setHours(0, 0, 0, 0);
          
          // If birthday already passed this year, check next year
          if (thisYearBirthday < today) {
            thisYearBirthday = new Date(today.getFullYear() + 1, month - 1, day);
          }
          
          const daysUntil = Math.round((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntil >= 0 && daysUntil <= 7) {
            alerts.push({
              type: 'aniversario',
              client_id: client.id,
              message: daysUntil === 0 
                ? `🎂 Hoje é aniversário de ${client.name}!`
                : `🎂 Aniversário de ${client.name} em ${daysUntil} dia${daysUntil > 1 ? 's' : ''}`,
              read: false,
              dismissed: false,
              assessor_id: client.assessor_id,
            });
          }
        }
      }

      // 2. Inactive clients (no revenue in 60+ days)
      const sixtyDaysAgo = new Date(today);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { data: activeClients } = await supabase
        .from('clients')
        .select('id, name, assessor_id')
        .eq('active', true);

      if (activeClients) {
        for (const client of activeClients) {
          const { data: recentRevenue } = await supabase
            .from('revenues')
            .select('date')
            .eq('client_id', client.id)
            .gte('date', sixtyDaysAgo.toISOString().split('T')[0])
            .limit(1);

          if (!recentRevenue || recentRevenue.length === 0) {
            const { data: lastRevenue } = await supabase
              .from('revenues')
              .select('date')
              .eq('client_id', client.id)
              .order('date', { ascending: false })
              .limit(1);

            if (lastRevenue && lastRevenue.length > 0) {
              const daysSince = Math.floor(
                (today.getTime() - new Date(lastRevenue[0].date).getTime()) / (1000 * 60 * 60 * 24)
              );
              
              alerts.push({
                type: 'inativo',
                client_id: client.id,
                message: `⚠️ ${client.name} está inativo há ${daysSince} dias`,
                read: false,
                dismissed: false,
                assessor_id: client.assessor_id,
              });
            }
          }
        }
      }

      // 3. Follow-up for leads without recent interaction
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: leads } = await supabase
        .from('leads')
        .select('id, name, assessor_id, updated_at')
        .in('status', ['novo', 'em_contato', 'troca_assessoria']);

      if (leads) {
        for (const lead of leads) {
          const updatedAt = new Date(lead.updated_at);
          if (updatedAt < sevenDaysAgo) {
            const daysSince = Math.floor(
              (today.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            alerts.push({
              type: 'follow_up',
              lead_id: lead.id,
              message: `📞 Follow-up necessário: ${lead.name} sem atualização há ${daysSince} dias`,
              read: false,
              dismissed: false,
              assessor_id: lead.assessor_id,
            });
          }
        }
      }

      // 4. Cross-selling opportunities (clients with high patrimony but few products)
      const { data: highPatrimonyClients } = await supabase
        .from('clients')
        .select('id, name, patrimony, assessor_id')
        .eq('active', true)
        .gte('patrimony', 500000);

      if (highPatrimonyClients) {
        for (const client of highPatrimonyClients) {
          const { data: products } = await supabase
            .from('revenues')
            .select('product_id')
            .eq('client_id', client.id);

          const uniqueProducts = new Set(products?.map(p => p.product_id) || []);
          
          if (uniqueProducts.size <= 2) {
            alerts.push({
              type: 'cross_selling',
              client_id: client.id,
              message: `💡 Oportunidade de cross-selling: ${client.name} (patrimônio R$ ${(client.patrimony || 0).toLocaleString('pt-BR')}) usa apenas ${uniqueProducts.size} produto(s)`,
              read: false,
              dismissed: false,
              assessor_id: client.assessor_id,
            });
          }
        }
      }

      // Clear existing non-dismissed alerts to avoid duplicates
      await supabase
        .from('alerts')
        .delete()
        .eq('dismissed', false);

      // Insert new alerts
      if (alerts.length > 0) {
        const { error } = await supabase.from('alerts').insert(alerts);
        if (error) throw error;
      }

      return alerts.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
