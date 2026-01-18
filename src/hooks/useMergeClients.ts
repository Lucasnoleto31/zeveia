import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/database';
import { toast } from 'sonner';

interface MergeClientsParams {
  targetClientId: string;
  sourceClientIds: string[];
  deleteSourceClients: boolean;
  allClients: Client[];
}

interface MergeResult {
  revenuesMerged: number;
  contractsMerged: number;
  platformCostsMerged: number;
  interactionsMerged: number;
  alertsMerged: number;
  accountsMapped: number;
  sourceClientsDeleted: number;
}

export function useMergeClients() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetClientId, sourceClientIds, deleteSourceClients, allClients }: MergeClientsParams): Promise<MergeResult> => {
      const result: MergeResult = {
        revenuesMerged: 0,
        contractsMerged: 0,
        platformCostsMerged: 0,
        interactionsMerged: 0,
        alertsMerged: 0,
        accountsMapped: 0,
        sourceClientsDeleted: 0,
      };

      // 1. Update revenues - transfer to target client
      const { data: revenues, error: revenuesError } = await supabase
        .from('revenues')
        .update({ client_id: targetClientId })
        .in('client_id', sourceClientIds)
        .select('id');

      if (revenuesError) throw new Error(`Erro ao mesclar receitas: ${revenuesError.message}`);
      result.revenuesMerged = revenues?.length || 0;

      // 2. Update contracts - transfer to target client
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .update({ client_id: targetClientId })
        .in('client_id', sourceClientIds)
        .select('id');

      if (contractsError) throw new Error(`Erro ao mesclar contratos: ${contractsError.message}`);
      result.contractsMerged = contracts?.length || 0;

      // 3. Update platform_costs - transfer to target client
      const { data: platformCosts, error: platformCostsError } = await supabase
        .from('platform_costs')
        .update({ client_id: targetClientId })
        .in('client_id', sourceClientIds)
        .select('id');

      if (platformCostsError) throw new Error(`Erro ao mesclar custos de plataforma: ${platformCostsError.message}`);
      result.platformCostsMerged = platformCosts?.length || 0;

      // 4. Update interactions - transfer to target client
      const { data: interactions, error: interactionsError } = await supabase
        .from('interactions')
        .update({ client_id: targetClientId })
        .in('client_id', sourceClientIds)
        .select('id');

      if (interactionsError) throw new Error(`Erro ao mesclar interações: ${interactionsError.message}`);
      result.interactionsMerged = interactions?.length || 0;

      // 5. Update alerts - transfer to target client
      const { data: alerts, error: alertsError } = await supabase
        .from('alerts')
        .update({ client_id: targetClientId })
        .in('client_id', sourceClientIds)
        .select('id');

      if (alertsError) throw new Error(`Erro ao mesclar alertas: ${alertsError.message}`);
      result.alertsMerged = alerts?.length || 0;

      // 6. Salvar mapeamento de contas para clientes de origem
      for (const sourceId of sourceClientIds) {
        const sourceClient = allClients.find(c => c.id === sourceId);
        if (sourceClient?.account_number) {
          const { error: mappingError } = await supabase
            .from('client_account_mappings')
            .upsert({
              client_id: targetClientId,
              account_number: sourceClient.account_number,
              original_client_name: sourceClient.name,
            }, { onConflict: 'account_number' });

          if (!mappingError) {
            result.accountsMapped++;
          }
        }
      }

      // 7. Delete or deactivate source clients
      if (deleteSourceClients) {
        const { error: deleteError } = await supabase
          .from('clients')
          .delete()
          .in('id', sourceClientIds);

        if (deleteError) throw new Error(`Erro ao excluir clientes duplicados: ${deleteError.message}`);
        result.sourceClientsDeleted = sourceClientIds.length;
      } else {
        // Just deactivate source clients
        const { error: deactivateError } = await supabase
          .from('clients')
          .update({ active: false })
          .in('id', sourceClientIds);

        if (deactivateError) throw new Error(`Erro ao desativar clientes duplicados: ${deactivateError.message}`);
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['revenues'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['platform_costs'] });
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['clientMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['accountMappings'] });

      const totalMerged = result.revenuesMerged + result.contractsMerged + 
                          result.platformCostsMerged + result.interactionsMerged + 
                          result.alertsMerged;

      const mappedMsg = result.accountsMapped > 0 ? `, ${result.accountsMapped} conta(s) mapeada(s)` : '';
      toast.success(
        `Merge concluído! ${totalMerged} registros transferidos${mappedMsg}${result.sourceClientsDeleted > 0 ? ` e ${result.sourceClientsDeleted} cliente(s) excluído(s)` : ''}.`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook to find potential duplicates based on CPF/CNPJ
export function useFindDuplicates(clients: Client[] | undefined) {
  if (!clients) return [];

  const duplicateGroups: { key: string; clients: Client[] }[] = [];
  const seen = new Map<string, Client[]>();

  clients.forEach(client => {
    // Group by CPF or CNPJ
    const identifier = client.type === 'pf' 
      ? client.cpf?.replace(/\D/g, '') 
      : client.cnpj?.replace(/\D/g, '');
    
    if (identifier) {
      const existing = seen.get(identifier) || [];
      existing.push(client);
      seen.set(identifier, existing);
    }
  });

  // Only return groups with more than one client
  seen.forEach((clientList, key) => {
    if (clientList.length > 1) {
      duplicateGroups.push({ key, clients: clientList });
    }
  });

  return duplicateGroups;
}
