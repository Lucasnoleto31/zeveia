import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useClient, useClientMetrics } from '@/hooks/useClients';
import { useRevenues } from '@/hooks/useRevenues';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  X
} from 'lucide-react';
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
} from 'recharts';

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
  'hsl(217, 91%, 60%)',
  'hsl(280, 65%, 60%)',
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

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id!);
  const { data: metrics, isLoading: metricsLoading } = useClientMetrics(id!);

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

  if (isLoading) {
    return (
      <MainLayout title="Carregando...">
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
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
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/clients')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        {/* Simplified Header */}
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

        {/* Metrics Cards */}
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

          {/* Receita do Mês */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita do Mês
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
                    {metrics?.revenueChange?.toFixed(0) || 0}% vs mês anterior
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

        {/* Main Content - Two Columns */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Dados Cadastrais */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Dados Cadastrais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {client.type === 'pf' ? (
                  <User className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium">
                  {client.type === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </span>
              </div>

              {client.type === 'pf' && client.cpf && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm w-20">CPF:</span>
                  <span className="font-mono">{client.cpf}</span>
                </div>
              )}

              {client.type === 'pj' && client.cnpj && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm w-20">CNPJ:</span>
                  <span className="font-mono">{client.cnpj}</span>
                </div>
              )}

              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
              )}

              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}

              {client.state && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{client.state}</span>
                </div>
              )}

              {client.birth_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(client.birth_date), 'dd/MM/yyyy')}</span>
                </div>
              )}

              {client.profile && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Perfil:</span>
                  <span className="font-medium capitalize">
                    {client.profile} {profileEmojis[client.profile] || ''}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Patrimônio:</span>
                <span className="font-medium">{getPatrimonyRange(client.patrimony)}</span>
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

        {/* Second Row - Cross-selling and Revenue by Product */}
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
      </div>
    </MainLayout>
  );
}
