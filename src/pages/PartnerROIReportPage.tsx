import { useState } from 'react';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { 
  Download, 
  Loader2, 
  Handshake,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Award,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { usePartnerROIReport, PartnerROIMetrics } from '@/hooks/usePartnerROIReport';
import { PeriodFilter, getPeriodLabel } from '@/components/reports/PeriodFilter';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4', '#ec4899'];

export default function PartnerROIReportPage() {
  const [periodType, setPeriodType] = useState<'preset' | 'custom'>('preset');
  const [months, setMonths] = useState(6);
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  
  const { data, isLoading } = usePartnerROIReport(
    periodType === 'custom' && customStartDate && customEndDate
      ? { startDate: format(customStartDate, 'yyyy-MM-dd'), endDate: format(customEndDate, 'yyyy-MM-dd') }
      : { months }
  );

  const periodLabel = getPeriodLabel(periodType, months, customStartDate, customEndDate);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatPercent = (value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.text('Relatório de ROI de Parceiros', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Período: ${periodLabel}`, pageWidth / 2, 30, { align: 'center' });

    // Totals
    doc.setFontSize(14);
    doc.text('Resumo Geral', 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Parceiros', data.totals.partners.toString()],
        ['Clientes Indicados', data.totals.clients.toString()],
        ['Receita Gerada', formatCurrency(data.totals.revenue)],
        ['Patrimônio Total', formatCurrency(data.totals.patrimony)],
        ['Comissões Estimadas', formatCurrency(data.totals.commissions)],
      ],
    });

    // Partners table
    const partnersY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Desempenho por Parceiro', 14, partnersY);

    autoTable(doc, {
      startY: partnersY + 5,
      head: [['Parceiro', 'Tipo', 'Clientes', 'Receita', 'Comissão', 'Crescimento']],
      body: data.partners.map((p) => [
        p.partner.name,
        p.partner.type === 'parceiro' ? 'Parceiro' : 'Influenciador',
        p.clientCount.toString(),
        formatCurrency(p.totalRevenue),
        formatCurrency(p.estimatedCommission),
        formatPercent(p.revenueGrowth),
      ]),
    });

    doc.save('relatorio-roi-parceiros.pdf');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Erro ao carregar dados de ROI</p>
        </div>
      </MainLayout>
    );
  }

  // Prepare chart data
  const topPartnersData = data.partners.slice(0, 10).map(p => ({
    name: p.partner.name.length > 15 ? p.partner.name.slice(0, 15) + '...' : p.partner.name,
    revenue: p.totalRevenue,
    commission: p.estimatedCommission,
    clients: p.clientCount,
  }));

  // Monthly data aggregated
  const monthlyAggregated = data.monthlyEvolution.reduce((acc, item) => {
    const existing = acc.find(a => a.month === item.month);
    if (existing) {
      existing.revenue += item.revenue;
    } else {
      acc.push({ month: item.month, revenue: item.revenue });
    }
    return acc;
  }, [] as { month: string; revenue: number }[]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Handshake className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">ROI de Parceiros</h1>
              <p className="text-sm text-muted-foreground">
                Análise de retorno sobre investimento em parcerias
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PeriodFilter
              periodType={periodType}
              onPeriodTypeChange={setPeriodType}
              months={months}
              onMonthsChange={setMonths}
              customStartDate={customStartDate}
              onCustomStartDateChange={setCustomStartDate}
              customEndDate={customEndDate}
              onCustomEndDateChange={setCustomEndDate}
            />

            <Button variant="outline" onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Top Partners Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.topPartners.byRevenue && (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Maior Receita</p>
                    <p className="font-bold">{data.topPartners.byRevenue.partner.name}</p>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      {formatCurrency(data.topPartners.byRevenue.totalRevenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {data.topPartners.byClients && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mais Indicações</p>
                    <p className="font-bold">{data.topPartners.byClients.partner.name}</p>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      {data.topPartners.byClients.clientCount} clientes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {data.topPartners.byROI && (
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Melhor ROI</p>
                    <p className="font-bold">{data.topPartners.byROI.partner.name}</p>
                    <p className="text-sm text-purple-700 dark:text-purple-400">
                      {data.topPartners.byROI.roi.toFixed(1)}x retorno
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Handshake className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{data.totals.partners}</p>
              <p className="text-xs text-muted-foreground">Parceiros Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{data.totals.clients}</p>
              <p className="text-xs text-muted-foreground">Clientes Indicados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(data.totals.revenue)}</p>
              <p className="text-xs text-muted-foreground">Receita Gerada</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Percent className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(data.totals.commissions)}</p>
              <p className="text-xs text-muted-foreground">Comissões Estimadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">
                {data.totals.commissions > 0 
                  ? (data.totals.revenue / data.totals.commissions).toFixed(1) 
                  : '0'}x
              </p>
              <p className="text-xs text-muted-foreground">ROI Médio</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue by Partner */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Parceiros por Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topPartnersData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number" 
                    className="text-xs"
                    tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === 'revenue' ? 'Receita' : 'Comissão'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Receita" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="commission" name="Comissão" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Evolution */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal de Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyAggregated}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis 
                    className="text-xs"
                    tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Receita']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ r: 6, fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Partner Type Comparison */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Receita por Tipo de Parceiro</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.revenueByPartnerType}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="revenue"
                    nameKey="type"
                    label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.revenueByPartnerType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Distribuição de Clientes por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.revenueByPartnerType.map((item, index) => (
                  <div key={item.type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{item.type}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{item.clients} clientes</span>
                        <span className="text-muted-foreground ml-2">
                          ({formatCurrency(item.revenue)})
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={(item.clients / data.totals.clients) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Partners Table */}
        <Card>
          <CardHeader>
            <CardTitle>Desempenho Detalhado por Parceiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Parceiro</th>
                    <th className="text-center py-3 px-4 font-medium">Tipo</th>
                    <th className="text-center py-3 px-4 font-medium">Clientes</th>
                    <th className="text-right py-3 px-4 font-medium">Receita</th>
                    <th className="text-right py-3 px-4 font-medium">Patrimônio</th>
                    <th className="text-center py-3 px-4 font-medium">Comissão %</th>
                    <th className="text-right py-3 px-4 font-medium">Comissão Est.</th>
                    <th className="text-center py-3 px-4 font-medium">Crescimento</th>
                    <th className="text-center py-3 px-4 font-medium">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {data.partners.map((p) => (
                    <tr key={p.partner.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{p.partner.name}</div>
                        {p.partner.email && (
                          <div className="text-xs text-muted-foreground">{p.partner.email}</div>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant={p.partner.type === 'parceiro' ? 'default' : 'secondary'}>
                          {p.partner.type === 'parceiro' ? 'Parceiro' : 'Influenciador'}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="font-medium">{p.clientCount}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({p.activeClients} ativos)
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 font-medium">
                        {formatCurrency(p.totalRevenue)}
                      </td>
                      <td className="text-right py-3 px-4 text-muted-foreground">
                        {formatCurrency(p.totalPatrimony)}
                      </td>
                      <td className="text-center py-3 px-4">
                        {p.partner.commission_percentage}%
                      </td>
                      <td className="text-right py-3 px-4 text-amber-600 font-medium">
                        {formatCurrency(p.estimatedCommission)}
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className={cn(
                          'flex items-center justify-center gap-1',
                          p.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {p.revenueGrowth >= 0 ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          {formatPercent(p.revenueGrowth)}
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge 
                          variant="outline"
                          className={cn(
                            p.roi >= 10 ? 'border-green-500 text-green-600' :
                            p.roi >= 5 ? 'border-yellow-500 text-yellow-600' :
                            'border-muted-foreground'
                          )}
                        >
                          {p.roi.toFixed(1)}x
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
