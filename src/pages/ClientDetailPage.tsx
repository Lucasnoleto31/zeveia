import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useClient, useClientMetrics } from '@/hooks/useClients';
import { INTERACTION_TYPES } from '@/hooks/useInteractions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowLeft, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  X,
  Edit,
  MessageCircle,
  BarChart3,
  Percent,
  CreditCard,
  ExternalLink,
  FileText,
  ListTodo,
  Plus,
  CheckCircle2,
  Target
} from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import { TaskWithRelations } from '@/types/tasks';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { ClientFormDialog } from '@/components/clients/ClientFormDialog';
import { InteractionFormDialog } from '@/components/clients/InteractionFormDialog';
import { CreateOpportunityDialog } from '@/components/clients/CreateOpportunityDialog';
import { OpportunitiesHistory } from '@/components/clients/OpportunitiesHistory';

const profileEmojis: Record<string, string> = {
  conservador: '🛡️',
  moderado: '⚖️',
  arrojado: '🚀',
  agressivo: '🔥',
};

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
];

function getPatrimonyRange(value?: number): string {
  if (!value) return '-';
  if (value < 50000) return 'Até R$ 50.000';
  if (value < 100000) return 'R$ 50.000 - R$ 100.000';
  if (value < 250000) return 'R$ 100.000 - R$ 250.000';
  if (value < 500000) return 'R$ 250.000 - R$ 500.000';
  if (value < 1000000) return 'R$ 500.000 - R$ 1.000.000';
  if (value < 5000000) return 'R$ 1.000.000 - R$ 5.000.000';
  return 'Acima de R$ 5.000.000';
}

function getInteractionIcon(type: string): string {
  const found = INTERACTION_TYPES.find(t => t.value === type);
  return found?.icon || '📝';
}

function getInteractionLabel(type: string): string {
  const found = INTERACTION_TYPES.find(t => t.value === type);
  return found?.label || type;
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id!);
  const { data: metrics, isLoading: metricsLoading } = useClientMetrics(id!);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [opportunityDialogOpen, setOpportunityDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);
  
  const { data: tasks, isLoading: tasksLoading } = useTasks({ client_id: id });
  const pendingTasks = tasks?.filter(t => t.status !== 'concluida' && t.status !== 'cancelada') || [];
  const completedTasks = tasks?.filter(t => t.status === 'concluida') || [];

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
    return `R$ ${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (isLoading) {
    return (
      <MainLayout title="Carregando...">
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!client) {
    return (
      <MainLayout title="Cliente não encontrado">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cliente não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/clients')}>
            Voltar para Clientes
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/clients')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpportunityDialogOpen(true)} className="gap-2">
              <Target className="h-4 w-4" />
              Nova Oportunidade
            </Button>
            <Button variant="outline" onClick={() => setInteractionDialogOpen(true)} className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Nova Interação
            </Button>
            <Button onClick={() => setEditDialogOpen(true)} className="gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">
            {client.type === 'pf' ? client.name : client.company_name}
          </h1>
          <Badge variant={client.active ? 'default' : 'secondary'} className="text-sm">
            {client.active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
        <p className="text-muted-foreground -mt-4">
          Cliente desde {format(new Date(client.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>

        {/* Metrics Cards - First Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Receita Total */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(metrics?.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">Lifetime value</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Receita Mês Anterior */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita Mês Anterior
              </CardTitle>
              {metrics?.revenueChange !== undefined && metrics.revenueChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(metrics?.monthlyRevenue)}</div>
                  <p className={`text-xs ${metrics?.revenueChange !== undefined && metrics.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {metrics?.revenueChange !== undefined && metrics.revenueChange >= 0 ? '+' : ''}
                    {metrics?.revenueChange?.toFixed(0) || 0}% vs 2 meses atrás
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Última Receita */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Última Receita
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {metrics?.lastRevenueDate 
                      ? format(new Date(metrics.lastRevenueDate), 'dd/MM/yyyy')
                      : 'Nunca'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.lastRevenueDate 
                      ? formatDistanceToNow(new Date(metrics.lastRevenueDate), { addSuffix: false, locale: ptBR })
                      : '-'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Produtos Ativos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Produtos Ativos
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics?.activeProducts || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    de {metrics?.totalProducts || 0} disponíveis
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Metrics Cards - Second Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Lotes Girados */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lotes Girados
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatNumber(metrics?.totalLotsTraded || 0)}</div>
                  <p className={`text-xs ${(metrics?.lotsChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(metrics?.lotsChange || 0) >= 0 ? '+' : ''}
                    {metrics?.lotsChange?.toFixed(0) || 0}% vs 2 meses atrás
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Taxa de Zeragem */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Zeragem
              </CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics?.zeroRate?.toFixed(1) || 0}%</div>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(metrics?.totalLotsZeroed || 0)} lotes zerados
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Custo Plataforma */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Custo Plataforma
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(metrics?.totalPlatformCost)}</div>
                  <p className={`text-xs ${(metrics?.platformCostChange || 0) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {(metrics?.platformCostChange || 0) >= 0 ? '+' : ''}
                    {metrics?.platformCostChange?.toFixed(0) || 0}% vs 2 meses atrás
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Última Interação */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Última Interação
              </CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {metrics?.lastInteraction 
                      ? format(new Date(metrics.lastInteraction.created_at), 'dd/MM/yyyy')
                      : 'Nunca'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.lastInteraction 
                      ? `${getInteractionIcon(metrics.lastInteraction.type)} ${getInteractionLabel(metrics.lastInteraction.type)}`
                      : '-'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content - First Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Dados Cadastrais */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Dados Cadastrais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground text-sm block">Tipo</span>
                  <span className="font-medium flex items-center gap-2">
                    {client.type === 'pf' ? (
                      <>
                        <User className="h-4 w-4" />
                        Pessoa Física
                      </>
                    ) : (
                      <>
                        <Building2 className="h-4 w-4" />
                        Pessoa Jurídica
                      </>
                    )}
                  </span>
                </div>

                {client.account_number && (
                  <div>
                    <span className="text-muted-foreground text-sm block">Número da Conta</span>
                    <span className="font-mono">{client.account_number}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                {client.type === 'pf' && client.cpf && (
                  <div>
                    <span className="text-muted-foreground text-sm block">CPF</span>
                    <span className="font-mono">{client.cpf}</span>
                  </div>
                )}

                {client.type === 'pj' && client.cnpj && (
                  <div>
                    <span className="text-muted-foreground text-sm block">CNPJ</span>
                    <span className="font-mono">{client.cnpj}</span>
                  </div>
                )}

                {client.birth_date && (
                  <div>
                    <span className="text-muted-foreground text-sm block">Data de Nascimento</span>
                    <span>{format(new Date(client.birth_date), 'dd/MM/yyyy')}</span>
                  </div>
                )}

                {client.email && (
                  <div>
                    <span className="text-muted-foreground text-sm block">E-mail</span>
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {client.email}
                    </span>
                  </div>
                )}

                {client.phone && (
                  <div>
                    <span className="text-muted-foreground text-sm block">Telefone</span>
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {client.phone}
                    </span>
                  </div>
                )}

                {client.state && (
                  <div>
                    <span className="text-muted-foreground text-sm block">Estado</span>
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {client.state}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                {client.profile && (
                  <div>
                    <span className="text-muted-foreground text-sm block">Perfil de Investidor</span>
                    <span className="font-medium capitalize">
                      {client.profile} {profileEmojis[client.profile] || ''}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-muted-foreground text-sm block">Patrimônio</span>
                  <span className="font-medium">{getPatrimonyRange(client.patrimony)}</span>
                </div>

                {client.origin && (
                  <div>
                    <span className="text-muted-foreground text-sm block">Origem</span>
                    <span>{client.origin.name}</span>
                  </div>
                )}

                {client.campaign && (
                  <div>
                    <span className="text-muted-foreground text-sm block">Campanha</span>
                    <span>{client.campaign.name}</span>
                  </div>
                )}

                {client.partner && (
                  <div>
                    <span className="text-muted-foreground text-sm block">Parceiro</span>
                    <Link 
                      to={`/partners/${client.partner.id}`}
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      {client.partner.name}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>

              {client.observations && (
                <>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground text-sm block mb-1">Observações</span>
                    <p className="text-sm">{client.observations}</p>
                  </div>
                </>
              )}

              <Separator />
              
              <div className="text-xs text-muted-foreground">
                Última atualização: {format(new Date(client.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Histórico de Receita Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Receita</CardTitle>
              <CardDescription>Últimos 12 meses</CardDescription>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : metrics?.revenueByMonth && metrics.revenueByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metrics.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tickFormatter={formatCurrencyShort}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Receita']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Sem dados de receita
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second Row - Platform Costs and Operations */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Custos de Plataforma */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                Custos de Plataforma
              </CardTitle>
              <CardDescription>
                {metricsLoading ? (
                  <Skeleton className="h-4 w-48" />
                ) : (
                  <>
                    {metrics?.platformsUsed || 0} plataforma(s) • Média mensal: {formatCurrency(metrics?.avgMonthlyCost)}
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : metrics?.costByPlatform && metrics.costByPlatform.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={metrics.costByPlatform} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number" 
                      tickFormatter={formatCurrencyShort}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Custo']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Sem dados de custos de plataforma
                </div>
              )}
            </CardContent>
          </Card>

          {/* Operações/Contratos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                Operações por Ativo
              </CardTitle>
              <CardDescription>
                {metricsLoading ? (
                  <Skeleton className="h-4 w-48" />
                ) : (
                  <>
                    {formatNumber(metrics?.totalLotsTraded || 0)} girados • {formatNumber(metrics?.totalLotsZeroed || 0)} zerados
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : metrics?.lotsByAsset && metrics.lotsByAsset.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={metrics.lotsByAsset}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="traded" name="Girados" fill="hsl(var(--chart-1))" stackId="a" />
                    <Bar dataKey="zeroed" name="Zerados" fill="hsl(var(--chart-2))" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Sem dados de operações
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Third Row - Cross-selling and Revenue by Product */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Cross-selling Opportunities */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Oportunidades de Cross-selling</CardTitle>
                <CardDescription>Produtos que o cliente ainda não utiliza</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : metrics?.unusedProducts && metrics.unusedProducts.length > 0 ? (
                <div className="space-y-2">
                  {metrics.unusedProducts.map((product) => (
                    <div 
                      key={product.id} 
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{product.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Cliente já utiliza todos os produtos disponíveis! 🎉
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Product - Donut Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Receita por Produto</CardTitle>
              <CardDescription>Distribuição total</CardDescription>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : metrics?.revenueByProduct && metrics.revenueByProduct.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.revenueByProduct}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {metrics.revenueByProduct.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend 
                      formatter={(value, entry) => {
                        const item = metrics.revenueByProduct.find(p => p.name === value);
                        return `${value} - ${formatCurrency(item?.value)}`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sem dados de receita por produto
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fourth Row - Tasks Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Tarefas Agendadas</CardTitle>
                <CardDescription>
                  {pendingTasks.length} tarefa(s) pendente(s)
                </CardDescription>
              </div>
              {pendingTasks.length > 0 && (
                <Badge variant="secondary">{pendingTasks.length}</Badge>
              )}
            </div>
            <Button size="sm" onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <Skeleton className="h-20" />
            ) : pendingTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Nenhuma tarefa pendente para este cliente
              </p>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    compact
                    onEdit={(t) => { setEditingTask(t); setTaskDialogOpen(true); }}
                  />
                ))}
              </div>
            )}
            
            {completedTasks.length > 0 && (
              <Collapsible className="mt-4">
                <CollapsibleTrigger className="text-sm text-muted-foreground hover:underline flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  {completedTasks.length} tarefa(s) concluída(s)
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {completedTasks.slice(0, 5).map((task) => (
                    <TaskCard key={task.id} task={task} compact />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>

        {/* Fifth Row - Opportunities History */}
        <OpportunitiesHistory 
          clientId={client.id} 
          onCreateOpportunity={() => setOpportunityDialogOpen(true)}
        />

        {/* Sixth Row - Interactions Timeline */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Histórico de Interações</CardTitle>
                <CardDescription>Últimas {metrics?.totalInteractions || 0} interações registradas</CardDescription>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setInteractionDialogOpen(true)} className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Nova Interação
            </Button>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : metrics?.interactions && metrics.interactions.length > 0 ? (
              <div className="space-y-4">
                {metrics.interactions.map((interaction) => (
                  <div 
                    key={interaction.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="text-2xl">{getInteractionIcon(interaction.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{getInteractionLabel(interaction.type)}</span>
                        <span className="text-muted-foreground text-xs">•</span>
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(interaction.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <span className="text-muted-foreground text-xs">•</span>
                        <span className="text-muted-foreground text-xs">
                          {interaction.userName}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {interaction.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Nenhuma interação registrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ClientFormDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        client={client}
      />
      <InteractionFormDialog
        open={interactionDialogOpen}
        onOpenChange={setInteractionDialogOpen}
        clientId={client.id}
      />
      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editingTask}
        defaultClientId={id}
      />
      <CreateOpportunityDialog
        open={opportunityDialogOpen}
        onOpenChange={setOpportunityDialogOpen}
        client={client}
        unusedProducts={metrics?.unusedProducts}
      />
    </MainLayout>
  );
}
