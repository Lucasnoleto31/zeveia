import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  ShieldAlert,
  BookOpen,
  ListTodo,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Loader2,
  Eye,
  Play,
  Check,
  SkipForward,
  AlertTriangle,
  Heart,
} from 'lucide-react';
import { useRetentionDashboard, useRetentionPlaybooks, useStartPlaybook, useCompleteRetentionAction, useSkipRetentionAction } from '@/hooks/useRetention';
import { useBulkHealthScores, useHealthScoresSummary } from '@/hooks/useHealthScore';
import { useChurnSummary } from '@/hooks/useChurnPrediction';
import { HealthScoreBadge } from '@/components/clients/HealthScoreBadge';
import {
  RiskClassification,
  RISK_CLASSIFICATIONS,
  ACTION_TYPE_LABELS,
  AtRiskClientRow,
} from '@/types/retention';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RetentionDashboardPage() {
  const navigate = useNavigate();
  const [classificationFilter, setClassificationFilter] = useState<string>('all');
  const [playbookDialogOpen, setPlaybookDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<AtRiskClientRow | null>(null);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>('');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionDialogType, setActionDialogType] = useState<'complete' | 'skip'>('complete');
  const [selectedActionId, setSelectedActionId] = useState<string>('');
  const [actionNotes, setActionNotes] = useState('');

  const { data: dashboard, isLoading: dashboardLoading } = useRetentionDashboard();
  const { data: healthSummary, isLoading: summaryLoading } = useHealthScoresSummary();
  const { data: churnSummary } = useChurnSummary();
  const { data: playbooks } = useRetentionPlaybooks();

  const bulkHealthScores = useBulkHealthScores();
  const startPlaybook = useStartPlaybook();
  const completeAction = useCompleteRetentionAction();
  const skipAction = useSkipRetentionAction();

  const handleRecalculateScores = () => {
    bulkHealthScores.mutate(undefined, {
      onSuccess: (count) => toast.success(`${count} health score(s) recalculados`),
      onError: () => toast.error('Erro ao recalcular health scores'),
    });
  };

  const handleStartPlaybook = () => {
    if (!selectedClient || !selectedPlaybookId) return;

    startPlaybook.mutate(
      { clientId: selectedClient.clientId, playbookId: selectedPlaybookId },
      {
        onSuccess: () => {
          toast.success(`Playbook iniciado para ${selectedClient.clientName}`);
          setPlaybookDialogOpen(false);
          setSelectedClient(null);
          setSelectedPlaybookId('');
        },
        onError: () => toast.error('Erro ao iniciar playbook'),
      },
    );
  };

  const handleActionComplete = () => {
    if (!selectedActionId) return;

    if (actionDialogType === 'complete') {
      completeAction.mutate(
        { id: selectedActionId, notes: actionNotes || undefined },
        {
          onSuccess: () => {
            toast.success('Ação marcada como concluída');
            setActionDialogOpen(false);
            setActionNotes('');
          },
          onError: () => toast.error('Erro ao completar ação'),
        },
      );
    } else {
      skipAction.mutate(
        { id: selectedActionId, notes: actionNotes || undefined },
        {
          onSuccess: () => {
            toast.success('Ação pulada');
            setActionDialogOpen(false);
            setActionNotes('');
          },
          onError: () => toast.error('Erro ao pular ação'),
        },
      );
    }
  };

  const openPlaybookDialog = (client: AtRiskClientRow) => {
    setSelectedClient(client);
    setSelectedPlaybookId('');
    setPlaybookDialogOpen(true);
  };

  const openActionDialog = (actionId: string, type: 'complete' | 'skip') => {
    setSelectedActionId(actionId);
    setActionDialogType(type);
    setActionNotes('');
    setActionDialogOpen(true);
  };

  // Filter at-risk clients
  const filteredClients = dashboard?.atRiskClients?.filter(c => {
    if (classificationFilter === 'all') return true;
    return c.classification === classificationFilter;
  }) || [];

  const isLoading = dashboardLoading || summaryLoading;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Retenção</h1>
              <p className="text-sm text-muted-foreground">
                Health scores, predição de churn e playbooks de retenção
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleRecalculateScores}
            disabled={bulkHealthScores.isPending}
          >
            {bulkHealthScores.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Recalcular Scores
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Clients at Risk */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes em Risco
              </CardTitle>
              <ShieldAlert className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{dashboard?.clientsAtRisk || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    atenção + crítico + perdido
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Active Playbooks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Playbooks Ativos
              </CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{dashboard?.activePlaybooks || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    clientes com playbook em andamento
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions Pending */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ações Pendentes
              </CardTitle>
              <ListTodo className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{dashboard?.actionsPending || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboard?.actionsCompleted || 0} concluídas
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Retention Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Retenção
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{dashboard?.retentionRate || 100}%</div>
                  <p className="text-xs text-muted-foreground">
                    dos eventos de churn resolvidos
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Health Score Distribution */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(['healthy', 'attention', 'critical', 'lost'] as const).map((cls) => {
            const meta = RISK_CLASSIFICATIONS[cls];
            const count = healthSummary?.[cls] ?? 0;
            return (
              <Card key={cls} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setClassificationFilter(cls)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{meta.label}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    <Badge className={meta.badgeColor}>{cls === classificationFilter ? '✓' : ''}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setClassificationFilter('all')}>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-muted-foreground">Score Médio</p>
                <p className="text-2xl font-bold">{healthSummary?.averageScore ?? '-'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* At-Risk Clients Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Clientes em Risco
                </CardTitle>
                <CardDescription>
                  {filteredClients.length} cliente(s) necessitando atenção
                </CardDescription>
              </div>
              <Select value={classificationFilter} onValueChange={setClassificationFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar classificação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="attention">Atenção</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="lost">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500/30" />
                <p>Nenhum cliente em risco nesta classificação</p>
                <p className="text-xs mt-1">
                  Clique em "Recalcular Scores" para atualizar os health scores.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Health Score</TableHead>
                      <TableHead>Risco de Churn</TableHead>
                      <TableHead>Playbook Ativo</TableHead>
                      <TableHead>Próxima Ação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.clientId} className="hover:bg-muted/50">
                        <TableCell>
                          <button
                            className="font-medium text-left hover:underline"
                            onClick={() => navigate(`/clients/${client.clientId}`)}
                          >
                            {client.clientName}
                          </button>
                        </TableCell>
                        <TableCell>
                          <HealthScoreBadge
                            score={client.healthScore}
                            classification={client.classification}
                            showLabel
                          />
                        </TableCell>
                        <TableCell>
                          {client.churnProbability !== null ? (
                            <span className={
                              client.churnProbability >= 60
                                ? 'text-red-600 font-medium'
                                : client.churnProbability >= 30
                                  ? 'text-orange-600 font-medium'
                                  : 'text-muted-foreground'
                            }>
                              {client.churnProbability}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.activePlaybook ? (
                            <Badge variant="outline" className="text-xs">
                              {client.activePlaybook}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Nenhum</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.nextAction ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {ACTION_TYPE_LABELS[client.nextAction.action_type]?.icon || '📋'}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs truncate max-w-40">
                                  {client.nextAction.description}
                                </p>
                                {client.nextAction.due_date && (
                                  <p className="text-[10px] text-muted-foreground">
                                    Prazo: {format(new Date(client.nextAction.due_date), 'dd/MM', { locale: ptBR })}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => navigate(`/clients/${client.clientId}`)}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!client.activePlaybook && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600"
                                onClick={() => openPlaybookDialog(client)}
                                title="Iniciar playbook"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {client.nextAction && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-600"
                                  onClick={() => openActionDialog(client.nextAction!.id, 'complete')}
                                  title="Concluir ação"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground"
                                  onClick={() => openActionDialog(client.nextAction!.id, 'skip')}
                                  title="Pular ação"
                                >
                                  <SkipForward className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Score Methodology */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📊 Como o Health Score é calculado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Recência</span>
                  <Badge variant="secondary">30%</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Há quanto tempo o cliente gerou receita pela última vez
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Frequência</span>
                  <Badge variant="secondary">25%</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Quantidade de operações por mês nos últimos 6 meses
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Valor</span>
                  <Badge variant="secondary">20%</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Receita média mensal comparada com a mediana dos clientes
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Tendência</span>
                  <Badge variant="secondary">15%</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Crescimento mês a mês da receita (momentum)
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Engajamento</span>
                  <Badge variant="secondary">10%</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Frequência de interações registradas nos últimos 90 dias
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>🟢 <strong>Saudável:</strong> ≥ 75</span>
              <span>🟡 <strong>Atenção:</strong> 50–74</span>
              <span>🟠 <strong>Crítico:</strong> 25–49</span>
              <span>🔴 <strong>Perdido:</strong> &lt; 25</span>
            </div>
          </CardContent>
        </Card>

        {/* Churn Summary */}
        {churnSummary && churnSummary.totalEvents > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Churn</CardTitle>
              <CardDescription>Eventos de predição de churn e seus resultados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Eventos</p>
                  <p className="text-2xl font-bold">{churnSummary.totalEvents}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{churnSummary.pendingEvents}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Retidos</p>
                  <p className="text-2xl font-bold text-green-600">{churnSummary.retainedCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Perdidos</p>
                  <p className="text-2xl font-bold text-red-600">{churnSummary.churnedCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prob. Média</p>
                  <p className="text-2xl font-bold">{churnSummary.avgChurnProbability}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Start Playbook Dialog */}
      <Dialog open={playbookDialogOpen} onOpenChange={setPlaybookDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Playbook de Retenção</DialogTitle>
            <DialogDescription>
              Selecione um playbook para aplicar ao cliente{' '}
              <strong>{selectedClient?.clientName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Select value={selectedPlaybookId} onValueChange={setSelectedPlaybookId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um playbook" />
              </SelectTrigger>
              <SelectContent>
                {(playbooks || []).map((pb) => (
                  <SelectItem key={pb.id} value={pb.id}>
                    <div className="flex items-center gap-2">
                      <Badge className={RISK_CLASSIFICATIONS[pb.risk_classification].badgeColor} variant="secondary">
                        {RISK_CLASSIFICATIONS[pb.risk_classification].label}
                      </Badge>
                      <span>{pb.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(pb.steps as any[]).length} passos)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPlaybookId && playbooks && (
              <div className="border rounded-lg p-3 space-y-2">
                {(() => {
                  const pb = playbooks.find(p => p.id === selectedPlaybookId);
                  if (!pb) return null;
                  const steps = pb.steps as any[];
                  return (
                    <>
                      <p className="text-sm font-medium">{pb.name}</p>
                      {pb.description && (
                        <p className="text-xs text-muted-foreground">{pb.description}</p>
                      )}
                      <div className="space-y-1 mt-2">
                        {steps.map((step: any) => (
                          <div key={step.order} className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground font-mono">#{step.order}</span>
                            <span>{ACTION_TYPE_LABELS[step.action]?.icon || '📋'}</span>
                            <span className="truncate">{step.description}</span>
                            <span className="text-muted-foreground ml-auto whitespace-nowrap">
                              {step.deadline_days}d
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPlaybookDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleStartPlaybook}
              disabled={!selectedPlaybookId || startPlaybook.isPending}
            >
              {startPlaybook.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Iniciar Playbook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete/Skip Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialogType === 'complete' ? 'Concluir Ação' : 'Pular Ação'}
            </DialogTitle>
            <DialogDescription>
              {actionDialogType === 'complete'
                ? 'Marcar esta ação como concluída. Adicione notas opcionais.'
                : 'Pular esta ação. Adicione o motivo.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder={actionDialogType === 'complete' ? 'Notas sobre a ação realizada...' : 'Motivo para pular esta ação...'}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleActionComplete}
              disabled={completeAction.isPending || skipAction.isPending}
              variant={actionDialogType === 'complete' ? 'default' : 'secondary'}
            >
              {(completeAction.isPending || skipAction.isPending) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : actionDialogType === 'complete' ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <SkipForward className="h-4 w-4 mr-2" />
              )}
              {actionDialogType === 'complete' ? 'Concluir' : 'Pular'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
