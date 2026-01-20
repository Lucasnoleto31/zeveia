import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePartner } from '@/hooks/usePartners';
import { usePartnerDetail } from '@/hooks/usePartnerROI';
import { usePartnerCommissions, useDeletePartnerCommission, PartnerCommission } from '@/hooks/usePartnerCommissions';
import { CommissionFormDialog } from '@/components/partners/CommissionFormDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Users,
  DollarSign,
  Wallet,
  Percent,
  TrendingUp,
  Handshake,
  Megaphone,
  Search,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [clientSearch, setClientSearch] = useState('');
  const [commissionFormOpen, setCommissionFormOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<PartnerCommission | undefined>();
  const [deleteCommissionId, setDeleteCommissionId] = useState<string | null>(null);

  const { data: partner, isLoading: partnerLoading } = usePartner(id || '');
  const { data: detail, isLoading: detailLoading } = usePartnerDetail(id || null);
  const { data: commissions, isLoading: commissionsLoading } = usePartnerCommissions(id || null);
  const deleteCommission = useDeletePartnerCommission();

  const isLoading = partnerLoading || detailLoading;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`;
    }
    return formatCurrency(value);
  };

  const chartData = detail?.revenueByMonth.map((item) => ({
    month: format(new Date(item.month + '-01'), 'MMM/yy', { locale: ptBR }),
    value: item.value,
  })) || [];

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!detail?.clients) return [];
    if (!clientSearch) return detail.clients;
    
    const search = clientSearch.toLowerCase();
    return detail.clients.filter((client) =>
      client.name.toLowerCase().includes(search)
    );
  }, [detail?.clients, clientSearch]);

  // Calculate commission totals
  const commissionTotals = useMemo(() => {
    if (!commissions) return { total: 0, paid: 0, pending: 0 };
    return commissions.reduce(
      (acc, c) => {
        acc.total += Number(c.amount);
        if (c.status === 'paid') acc.paid += Number(c.amount);
        if (c.status === 'pending') acc.pending += Number(c.amount);
        return acc;
      },
      { total: 0, paid: 0, pending: 0 }
    );
  }, [commissions]);

  const handleEditCommission = (commission: PartnerCommission) => {
    setEditingCommission(commission);
    setCommissionFormOpen(true);
  };

  const handleDeleteCommission = async () => {
    if (!deleteCommissionId || !id) return;
    try {
      await deleteCommission.mutateAsync({ id: deleteCommissionId, partnerId: id });
      setDeleteCommissionId(null);
    } catch (error) {
      console.error('Error deleting commission:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pendente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Detalhes do Parceiro">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </MainLayout>
    );
  }

  if (!partner || !detail) {
    return (
      <MainLayout title="Parceiro não encontrado">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Parceiro não encontrado.</p>
          <Button className="mt-4" onClick={() => navigate('/partners')}>
            Voltar para Parceiros
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={partner.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/partners')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {partner.type === 'parceiro' ? (
                <Handshake className="h-6 w-6 text-blue-600" />
              ) : (
                <Megaphone className="h-6 w-6 text-purple-600" />
              )}
              <h1 className="text-2xl font-bold">{partner.name}</h1>
              <Badge
                variant="outline"
                className={
                  partner.type === 'parceiro'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-purple-600 text-purple-600'
                }
              >
                {partner.type === 'parceiro' ? 'Parceiro' : 'Influenciador'}
              </Badge>
              <Badge variant={partner.active ? 'default' : 'secondary'}>
                {partner.active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {partner.email && <span>{partner.email}</span>}
              {partner.email && partner.phone && <span> • </span>}
              {partner.phone && <span>{partner.phone}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Comissão</p>
            <p className="text-2xl font-bold text-primary">{partner.commission_percentage}%</p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{detail.metrics.clientCount}</div>
              <p className="text-xs text-muted-foreground">
                {detail.metrics.activeClients} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCompactCurrency(detail.metrics.totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Patrimônio</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCompactCurrency(detail.metrics.totalPatrimony)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Média/Cliente</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCompactCurrency(detail.metrics.avgRevenuePerClient)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-green-800 dark:text-green-200">
                Comissão Paga
              </CardTitle>
              <Percent className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCompactCurrency(detail.metrics.paidCommission)}
              </div>
              {detail.metrics.roi > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  ROI: {detail.metrics.roi.toFixed(1)}x
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Evolução de Receitas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis
                      tickFormatter={(value) => formatCompactCurrency(value)}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Receita']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="url(#colorValue)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="clients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clients">
              <Users className="h-4 w-4 mr-2" />
              Clientes ({detail.clients.length})
            </TabsTrigger>
            <TabsTrigger value="commissions">
              <DollarSign className="h-4 w-4 mr-2" />
              Comissões ({commissions?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Clientes Indicados</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cliente..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {clientSearch
                      ? 'Nenhum cliente encontrado com este filtro'
                      : 'Nenhum cliente indicado por este parceiro'}
                  </div>
                ) : (
                  <div className="rounded-md border max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Patrimônio</TableHead>
                          <TableHead className="text-right">Receita Total</TableHead>
                          <TableHead>Última Receita</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClients.map((client) => (
                          <TableRow
                            key={client.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/clients/${client.id}`)}
                          >
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{client.type.toUpperCase()}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(Number(client.patrimony) || 0)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium text-primary">
                              {formatCurrency(client.totalRevenue)}
                            </TableCell>
                            <TableCell>
                              {client.lastRevenue
                                ? format(new Date(client.lastRevenue), 'dd/MM/yyyy')
                                : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={client.active ? 'default' : 'secondary'}>
                                {client.active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {filteredClients.length > 0 && (
                  <div className="mt-4 text-sm text-muted-foreground text-right">
                    {filteredClients.length} de {detail.clients.length} cliente(s)
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Comissões Pagas</CardTitle>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-muted-foreground">
                        Total: <span className="font-medium text-foreground">{formatCurrency(commissionTotals.total)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Pago: <span className="font-medium text-green-600">{formatCurrency(commissionTotals.paid)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Pendente: <span className="font-medium text-yellow-600">{formatCurrency(commissionTotals.pending)}</span>
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingCommission(undefined);
                      setCommissionFormOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Comissão
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {commissionsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : !commissions?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma comissão registrada para este parceiro
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mês Referência</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead>Data Pagamento</TableHead>
                          <TableHead>Observações</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissions.map((commission) => (
                          <TableRow key={commission.id}>
                            <TableCell className="font-medium">
                              {format(new Date(commission.reference_month), 'MMMM/yyyy', {
                                locale: ptBR,
                              })}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {formatCurrency(commission.amount)}
                            </TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(commission.status)}
                            </TableCell>
                            <TableCell>
                              {commission.payment_date
                                ? format(new Date(commission.payment_date), 'dd/MM/yyyy')
                                : '-'}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-muted-foreground">
                              {commission.notes || '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditCommission(commission)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteCommissionId(commission.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
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
          </TabsContent>
        </Tabs>

        {/* Commission Form Dialog */}
        {id && (
          <CommissionFormDialog
            open={commissionFormOpen}
            onOpenChange={setCommissionFormOpen}
            partnerId={id}
            commission={editingCommission}
          />
        )}

        {/* Delete Commission Confirmation */}
        <AlertDialog open={!!deleteCommissionId} onOpenChange={() => setDeleteCommissionId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta comissão? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCommission}
                className="bg-destructive text-destructive-foreground"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
