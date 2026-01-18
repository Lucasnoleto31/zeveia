import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useClient, useClientMetrics } from '@/hooks/useClients';
import { useRevenues } from '@/hooks/useRevenues';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ArrowLeft, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  FileText,
  Clock,
  Pencil
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const profileColors: Record<string, string> = {
  conservador: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  moderado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  arrojado: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  agressivo: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id!);
  const { data: metrics, isLoading: metricsLoading } = useClientMetrics(id!);
  const { data: revenues, isLoading: revenuesLoading } = useRevenues({ clientId: id });

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Health score based on recent activity
  const getHealthScore = () => {
    if (!metrics?.lastRevenueDate) return { score: 'red', label: 'Sem receita' };
    const daysSinceRevenue = Math.floor(
      (Date.now() - new Date(metrics.lastRevenueDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceRevenue <= 30) return { score: 'green', label: 'Ativo' };
    if (daysSinceRevenue <= 60) return { score: 'yellow', label: 'Atenção' };
    return { score: 'red', label: 'Inativo' };
  };

  if (isLoading) {
    return (
      <MainLayout title="Carregando...">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
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

  const healthScore = getHealthScore();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/clients')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        {/* Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-full ${client.type === 'pf' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                  {client.type === 'pf' ? (
                    <User className="h-8 w-8 text-blue-600" />
                  ) : (
                    <Building2 className="h-8 w-8 text-purple-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">
                      {client.type === 'pf' ? client.name : client.company_name}
                    </h1>
                    <Badge variant="outline">{client.type.toUpperCase()}</Badge>
                    <div className={`w-3 h-3 rounded-full ${
                      healthScore.score === 'green' ? 'bg-green-500' :
                      healthScore.score === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} title={healthScore.label} />
                  </div>
                  {client.type === 'pj' && client.trade_name && (
                    <p className="text-muted-foreground">{client.trade_name}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {client.account_number && (
                      <span>Conta: {client.account_number}</span>
                    )}
                    {(client.cpf || client.cnpj) && (
                      <span className="font-mono">
                        {client.type === 'pf' ? client.cpf : client.cnpj}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {client.profile && (
                  <Badge className={profileColors[client.profile]}>
                    {client.profile.charAt(0).toUpperCase() + client.profile.slice(1)}
                  </Badge>
                )}
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex gap-6 mt-6 pt-6 border-t">
              {client.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.state && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{client.state}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Cliente desde {format(new Date(client.created_at), 'MMM/yyyy', { locale: ptBR })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <div className="text-2xl font-bold">{formatCurrency(metrics?.totalRevenue)}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita do Mês
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(metrics?.monthlyRevenue)}</div>
              )}
            </CardContent>
          </Card>

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
                <div className="text-2xl font-bold">
                  {metrics?.lastRevenueDate 
                    ? formatDistanceToNow(new Date(metrics.lastRevenueDate), { addSuffix: true, locale: ptBR })
                    : 'Nunca'}
                </div>
              )}
            </CardContent>
          </Card>

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
                <div className="text-2xl font-bold">
                  {metrics?.totalLotsTraded?.toLocaleString('pt-BR') || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="revenues" className="w-full">
          <TabsList>
            <TabsTrigger value="revenues" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Receitas
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-2">
              <FileText className="h-4 w-4" />
              Dados Cadastrais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenues" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Receitas</CardTitle>
                <CardDescription>Últimas receitas registradas</CardDescription>
              </CardHeader>
              <CardContent>
                {revenuesLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : revenues && revenues.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Subproduto</TableHead>
                        <TableHead className="text-right">Receita Bruta</TableHead>
                        <TableHead className="text-right">Impostos</TableHead>
                        <TableHead className="text-right">Nossa Parte</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenues.slice(0, 20).map((revenue) => (
                        <TableRow key={revenue.id}>
                          <TableCell>{format(new Date(revenue.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{revenue.product?.name}</TableCell>
                          <TableCell>{revenue.subproduct?.name || '-'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(revenue.gross_revenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(revenue.taxes)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(revenue.our_share)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhuma receita registrada
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Dados Cadastrais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {client.type === 'pf' ? (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium">{client.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CPF</p>
                        <p className="font-medium font-mono">{client.cpf || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                        <p className="font-medium">
                          {client.birth_date ? format(new Date(client.birth_date), 'dd/MM/yyyy') : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sexo</p>
                        <p className="font-medium capitalize">{client.sex || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Estado Civil</p>
                        <p className="font-medium capitalize">
                          {client.marital_status?.replace('_', ' ') || '-'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Razão Social</p>
                        <p className="font-medium">{client.company_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                        <p className="font-medium">{client.trade_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CNPJ</p>
                        <p className="font-medium font-mono">{client.cnpj || '-'}</p>
                      </div>
                      {client.responsible_name && (
                        <>
                          <div className="col-span-full border-t pt-4 mt-2">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Responsável</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Nome</p>
                            <p className="font-medium">{client.responsible_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">CPF</p>
                            <p className="font-medium font-mono">{client.responsible_cpf || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Cargo</p>
                            <p className="font-medium">{client.responsible_position || '-'}</p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  
                  <div className="col-span-full border-t pt-4 mt-2">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Informações Adicionais</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Patrimônio</p>
                    <p className="font-medium">{formatCurrency(client.patrimony)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Origem</p>
                    <p className="font-medium">{client.origin?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Campanha</p>
                    <p className="font-medium">{client.campaign?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Parceiro</p>
                    <p className="font-medium">{client.partner?.name || '-'}</p>
                  </div>
                  {client.observations && (
                    <div className="col-span-full">
                      <p className="text-sm text-muted-foreground">Observações</p>
                      <p className="font-medium">{client.observations}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
