import { Client } from '@/types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Pencil, 
  Phone, 
  Mail,
  User,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HealthScoreBadge } from './HealthScoreBadge';
import { RiskClassification, HealthScoreComponents } from '@/types/retention';

interface ClientsTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onView: (client: Client) => void;
}

const profileColors: Record<string, string> = {
  conservador: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  moderado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  arrojado: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  agressivo: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

// Hook to fetch latest health scores for all clients in bulk
function useClientsHealthScores(clientIds: string[]) {
  return useQuery({
    queryKey: ['healthScores', 'bulk', clientIds.sort().join(',')],
    queryFn: async () => {
      if (clientIds.length === 0) return new Map<string, { score: number; classification: RiskClassification; components: HealthScoreComponents }>();

      const { data, error } = await supabase
        .from('client_health_scores')
        .select('client_id, score, classification, components')
        .in('client_id', clientIds)
        .order('calculated_at', { ascending: false });

      if (error) throw error;

      // Deduplicate: keep only latest per client
      const map = new Map<string, { score: number; classification: RiskClassification; components: HealthScoreComponents }>();
      for (const s of (data || [])) {
        if (!map.has(s.client_id)) {
          map.set(s.client_id, {
            score: Number(s.score),
            classification: s.classification as RiskClassification,
            components: s.components as unknown as HealthScoreComponents,
          });
        }
      }
      return map;
    },
    enabled: clientIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function ClientsTable({ clients, onEdit, onView }: ClientsTableProps) {
  const clientIds = clients.map(c => c.id);
  const { data: healthScores } = useClientsHealthScores(clientIds);

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value);
  };

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum cliente encontrado</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Nome / Razão Social</TableHead>
            <TableHead>CPF / CNPJ</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Patrimônio</TableHead>
            <TableHead>Saúde</TableHead>
            <TableHead>Parceiro</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                {client.type === 'pf' ? (
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <User className="h-4 w-4" />
                    <span className="text-xs">PF</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-purple-600">
                    <Building2 className="h-4 w-4" />
                    <span className="text-xs">PJ</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">
                    {client.type === 'pf' ? client.name : client.company_name}
                  </p>
                  {client.type === 'pj' && client.trade_name && (
                    <p className="text-xs text-muted-foreground">{client.trade_name}</p>
                  )}
                  {client.account_number && (
                    <p className="text-xs text-muted-foreground">Conta: {client.account_number}</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {client.type === 'pf' ? client.cpf : client.cnpj}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {client.email && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-32">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {client.profile && (
                  <Badge variant="secondary" className={profileColors[client.profile]}>
                    {client.profile.charAt(0).toUpperCase() + client.profile.slice(1)}
                  </Badge>
                )}
              </TableCell>
              <TableCell>{formatCurrency(client.patrimony)}</TableCell>
              <TableCell>
                {healthScores?.get(client.id) ? (
                  <HealthScoreBadge
                    score={healthScores.get(client.id)!.score}
                    classification={healthScores.get(client.id)!.classification}
                    components={healthScores.get(client.id)!.components}
                    variant="small"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {client.partner && (
                  <Badge variant="outline" className="text-xs">
                    {client.partner.name}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onView(client)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(client)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
