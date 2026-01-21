import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ClientOpportunity {
  id: string;
  name: string;
  status: string;
  created_at: string;
  converted_at: string | null;
  lost_at: string | null;
  observations: string | null;
  target_product_id: string | null;
  target_product: { id: string; name: string } | null;
  origin: { id: string; name: string } | null;
  campaign: { id: string; name: string } | null;
  loss_reason: { id: string; name: string } | null;
  is_original_lead: boolean;
}

// Fetch all opportunities (leads) associated with a client
export function useClientOpportunities(clientId: string) {
  return useQuery({
    queryKey: ['clientOpportunities', clientId],
    queryFn: async () => {
      // Fetch leads linked to this client
      const { data: linkedLeads, error: linkedError } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          status,
          created_at,
          converted_at,
          lost_at,
          observations,
          target_product_id,
          target_product:products!leads_target_product_id_fkey(id, name),
          origin:origins(id, name),
          campaign:campaigns(id, name),
          loss_reason:loss_reasons(id, name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (linkedError) throw linkedError;

      // Fetch client to get converted_from_lead_id
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('converted_from_lead_id')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      let originalLead = null;
      if (client?.converted_from_lead_id) {
        const { data: origLead, error: origError } = await supabase
          .from('leads')
          .select(`
            id,
            name,
            status,
            created_at,
            converted_at,
            lost_at,
            observations,
            target_product_id,
            origin:origins(id, name),
            campaign:campaigns(id, name),
            loss_reason:loss_reasons(id, name)
          `)
          .eq('id', client.converted_from_lead_id)
          .maybeSingle();

        if (!origError && origLead) {
          originalLead = {
            ...origLead,
            target_product: null,
            is_original_lead: true,
          };
        }
      }

      // Combine and mark original lead
      const opportunities: ClientOpportunity[] = [
        ...(linkedLeads || []).map((lead: any) => ({
          ...lead,
          is_original_lead: false,
        })),
      ];

      // Add original lead if it exists and wasn't already in the list
      if (originalLead && !opportunities.some(o => o.id === originalLead.id)) {
        opportunities.push(originalLead);
      }

      // Sort by created_at descending
      opportunities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return opportunities;
    },
    enabled: !!clientId,
  });
}

// Create a new opportunity (lead) from an existing client
export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      clientId,
      clientName,
      clientEmail,
      clientPhone,
      clientState,
      targetProductId,
      campaignId,
      observations,
    }: {
      clientId: string;
      clientName: string;
      clientEmail?: string | null;
      clientPhone?: string | null;
      clientState?: string | null;
      targetProductId: string;
      campaignId?: string | null;
      observations?: string | null;
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('leads')
        .insert({
          client_id: clientId,
          name: clientName,
          email: clientEmail || null,
          phone: clientPhone || null,
          state: clientState || null,
          status: 'novo',
          target_product_id: targetProductId,
          campaign_id: campaignId || null,
          observations: observations || null,
          assessor_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientOpportunities', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
