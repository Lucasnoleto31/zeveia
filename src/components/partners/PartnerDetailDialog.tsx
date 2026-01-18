import { usePartnerDetail } from '@/hooks/usePartnerROI';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Users,
  DollarSign,
  TrendingUp,
  Percent,
  Wallet,
  Handshake,
  Megaphone,
} from 'lucide-react';

interface PartnerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string | null;
}

export function PartnerDetailDialog({ open, onOpenChange, partnerId }: PartnerDetailDialogProps) {
  const { data, isLoading } = usePartnerDetail(partnerId);

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

  const chartData = data?.revenueByMonth.map(item => ({
    month: format(new Date(item.month + '-01'), 'MMM/yy', { locale: ptBR }),
    value: item.value,
  })) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {data?.partner.type === 'parceiro' ? (
              <Handshake className="h-5 w-5 text-blue-600" />
            ) : (
              <Megaphone className="h-5 w-5 text-purple-600" />
            )}
            {data?.partner.name || 'Carregando...'}
          </DialogTitle>
          <DialogDescription>
            Visão detalhada do parceiro e ROI
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-64" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Partner Info */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="outline"
                    className={data.partner.type === 'parceiro' ? 'border-blue-600 text-blue-600' : 'border-purple-600 text-purple-600'}
                  >
                    {data.partner.type === 'parceiro' ? 'Parceiro' : 'Influenciador'}
                  </Badge>
                  <Badge variant={data.partner.active ? 'default' : 'secondary'}>
                    {data.partner.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {data.partner.email && <span>{data.partner.email}</span>}
                  {data.partner.email && data.partner.phone && <span> • </span>}
                  {data.partner.phone && <span>{data.partner.phone}</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Comissão</p>
                <p className="text-2xl font-bold text-primary">{data.partner.commission_percentage}%</p>
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
                  <div className="text-2xl font-bold">{data.metrics.clientCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.metrics.activeClients} ativos
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
                    {formatCompactCurrency(data.metrics.totalRevenue)}
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
                    {formatCompactCurrency(data.metrics.totalPatrimony)}
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
                    {formatCompactCurrency(data.metrics.avgRevenuePerClient)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium text-green-800 dark:text-green-200">
                    Comissão Estimada
                  </CardTitle>
                  <Percent className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCompactCurrency(data.metrics.estimatedCommission)}
                  </div>
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
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                        />
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

            {/* Clients Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Clientes Indicados</CardTitle>
              </CardHeader>
              <CardContent>
                {data.clients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum cliente indicado por este parceiro
                  </div>
                ) : (
                  <div className="rounded-md border max-h-[300px] overflow-y-auto">
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
                        {data.clients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {client.type.toUpperCase()}
                              </Badge>
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
                                : '-'
                              }
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
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
