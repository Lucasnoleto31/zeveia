import { Client } from '@/types/database';

export type MatchConfidence = 'high' | 'medium' | 'low' | null;
export type MatchMethod = 'account_number' | 'cpf' | 'cnpj' | 'name' | 'account_mapping' | null;

export interface ClientMatchResult {
  client: Client | null;
  matchedBy: MatchMethod;
  confidence: MatchConfidence;
}

export interface MatchInput {
  accountNumber?: string;
  cpf?: string;
  cnpj?: string;
  name?: string;
}

/**
 * Normaliza string removendo caracteres especiais (pontos, traços, barras)
 */
function normalizeDocument(doc: string | null | undefined): string {
  if (!doc) return '';
  return doc.replace(/\D/g, '');
}

/**
 * Normaliza string para comparação (lowercase, trim)
 */
function normalizeString(str: string | null | undefined): string {
  if (!str) return '';
  return str.toLowerCase().trim();
}

/**
 * Encontra cliente por hierarquia de identificadores:
 * 1. Número da Conta (alta confiança)
 * 2. CPF (alta confiança)
 * 3. CNPJ (alta confiança)
 * 4. Nome (baixa confiança - fallback)
 */
/**
 * Prioriza cliente ativo quando múltiplos clientes correspondem ao critério
 */
function preferActiveClient(matches: Client[]): Client | undefined {
  if (matches.length === 0) return undefined;
  // Ordenar por active DESC (ativos primeiro)
  const sorted = [...matches].sort((a, b) => {
    if (a.active === b.active) return 0;
    return a.active ? -1 : 1;
  });
  return sorted[0];
}

export function findClientMatch(
  clients: Client[],
  data: MatchInput
): ClientMatchResult {
  // 1. Tentar por número da conta (alta confiança)
  if (data.accountNumber) {
    const normalizedAccount = normalizeString(data.accountNumber);
    const matches = clients.filter(
      (c) => normalizeString(c.account_number) === normalizedAccount
    );
    const match = preferActiveClient(matches);
    if (match) {
      return { client: match, matchedBy: 'account_number', confidence: 'high' };
    }
  }

  // 2. Tentar por CPF (alta confiança) - prioriza ativo se houver duplicatas
  if (data.cpf) {
    const normalizedCpf = normalizeDocument(data.cpf);
    if (normalizedCpf.length >= 11) {
      const matches = clients.filter(
        (c) => normalizeDocument(c.cpf) === normalizedCpf
      );
      const match = preferActiveClient(matches);
      if (match) {
        return { client: match, matchedBy: 'cpf', confidence: 'high' };
      }
    }
  }

  // 3. Tentar por CNPJ (alta confiança) - prioriza ativo se houver duplicatas
  if (data.cnpj) {
    const normalizedCnpj = normalizeDocument(data.cnpj);
    if (normalizedCnpj.length >= 14) {
      const matches = clients.filter(
        (c) => normalizeDocument(c.cnpj) === normalizedCnpj
      );
      const match = preferActiveClient(matches);
      if (match) {
        return { client: match, matchedBy: 'cnpj', confidence: 'high' };
      }
    }
  }

  // 4. Tentar por nome (baixa confiança - fallback) - prioriza ativo
  if (data.name) {
    const normalizedName = normalizeString(data.name);
    const matches = clients.filter(
      (c) => normalizeString(c.name) === normalizedName
    );
    const match = preferActiveClient(matches);
    if (match) {
      return { client: match, matchedBy: 'name', confidence: 'low' };
    }
  }

  return { client: null, matchedBy: null, confidence: null };
}

/**
 * Retorna ícone de confiança para exibição
 */
export function getConfidenceIcon(confidence: MatchConfidence): string {
  switch (confidence) {
    case 'high':
      return '✓';
    case 'medium':
      return '~';
    case 'low':
      return '?';
    default:
      return '✗';
  }
}

/**
 * Retorna descrição do método de vinculação
 */
export function getMatchMethodLabel(method: MatchMethod): string {
  switch (method) {
    case 'account_number':
      return 'Número da Conta';
    case 'cpf':
      return 'CPF';
    case 'cnpj':
      return 'CNPJ';
    case 'name':
      return 'Nome';
    case 'account_mapping':
      return 'Conta Mapeada (Merge)';
    default:
      return 'Não encontrado';
  }
}

export interface AccountMappingData {
  id: string;
  client_id: string;
  account_number: string;
  original_client_name: string | null;
}

/**
 * Encontra cliente usando também a tabela de mapeamento de contas (para clientes mesclados)
 */
export function findClientMatchWithMappings(
  clients: Client[],
  mappings: AccountMappingData[],
  data: MatchInput
): ClientMatchResult {
  // 1. Primeiro, tenta match direto nos clientes
  const directMatch = findClientMatch(clients, data);
  if (directMatch.client) {
    return directMatch;
  }

  // 2. Se não encontrou e tem número de conta, busca na tabela de mapeamento
  if (data.accountNumber) {
    const normalizedAccount = data.accountNumber.toLowerCase().trim();
    const mapping = mappings.find(
      (m) => m.account_number?.toLowerCase().trim() === normalizedAccount
    );
    
    if (mapping) {
      const mappedClient = clients.find((c) => c.id === mapping.client_id);
      if (mappedClient) {
        return {
          client: mappedClient,
          matchedBy: 'account_mapping',
          confidence: 'high',
        };
      }
    }
  }

  return { client: null, matchedBy: null, confidence: null };
}
