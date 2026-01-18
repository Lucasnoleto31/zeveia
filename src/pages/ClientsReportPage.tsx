import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, FileDown, Users, TrendingUp, AlertTriangle, Wallet } from 'lucide-react';
import { useClientsReport } from '@/hooks/useClientsReport';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function ClientsReportPage() {
  const [months, setMonths] = useState(12);
  const { data, isLoading, error } = useClientsReport(months);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text('Relatório de Clientes', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Período: ${months} meses | Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });

    // Summary
    doc.setFontSize(14);
    doc.text('Resumo Geral', 14, 40);

    autoTable(doc, {
      startY: 45,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Clientes', data.totalClients.toString()],
        ['Clientes Ativos', data.activeClients.toString()],
        ['Patrimônio Total', formatCurrency(data.totalPatrimony)],
        ['LTV Médio', formatCurrency(data.averageLTV)],
        ['Taxa de Inatividade', formatPercent(data.inactivityRate)],
      ],
    });

    // Clients by state
    doc.setFontSize(14);
    doc.text('Clientes por Estado', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Estado', 'Quantidade']],
      body: data.clientsByState.map(s => [s.state, s.count.toString()]),
    });

    // ABC Curve
    doc.setFontSize(14);
    doc.text('Curva ABC', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Classe', 'Clientes', '% Clientes', 'Receita']],
      body: [
        ['A (80% receita)', data.abcCurve.aClients.toString(), formatPercent(data.abcCurve.aPercentage), formatCurrency(data.abcCurve.aRevenue)],
        ['B (15% receita)', data.abcCurve.bClients.toString(), formatPercent(data.abcCurve.bPercentage), formatCurrency(data.abcCurve.bRevenue)],
        ['C (5% receita)', data.abcCurve.cClients.toString(), formatPercent(data.abcCurve.cPercentage), formatCurrency(data.abcCurve.cRevenue)],
      ],
    });

    doc.save(`relatorio-clientes-${months}m.pdf`);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-destructive">Erro ao carregar relatório</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Relatório de Clientes</h1>
            <p className="text-muted-foreground">Análise completa da base de clientes</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={months.toString()} onValueChange={(v) => setMonths(Number(v))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToPDF} variant="outline">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                {data.activeClients} ativos • {data.inactiveClients} inativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Patrimônio Total</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.totalPatrimony)}</div>
              <p className="text-xs text-muted-foreground">Sob gestão</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">LTV Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.averageLTV)}</div>
              <p className="text-xs text-muted-foreground">Receita média por cliente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Inatividade</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data.inactivityRate > 20 ? 'text-destructive' : 'text-green-600'}`}>
                {formatPercent(data.inactivityRate)}
              </div>
              <p className="text-xs text-muted-foreground">60+ dias sem receita</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Patrimony by Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Patrimônio por Perfil</CardTitle>
              <CardDescription>Distribuição do patrimônio por perfil de investidor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.patrimonyByProfile} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis type="category" dataKey="profile" width={100} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Patrimônio']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Clients by State */}
          <Card>
            <CardHeader>
              <CardTitle>Clientes por Estado</CardTitle>
              <CardDescription>Top 10 estados com mais clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.clientsByState}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="state" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Clientes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Clients by Month */}
          <Card>
            <CardHeader>
              <CardTitle>Clientes Ativos por Mês</CardTitle>
              <CardDescription>Clientes com receita no período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.activeClientsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                      name="Clientes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Average Contract Volume */}
          <Card>
            <CardHeader>
              <CardTitle>Volume Médio de Contratos</CardTitle>
              <CardDescription>Média de lotes por mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.avgContractVolume}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke="hsl(var(--chart-3))"
                      fill="hsl(var(--chart-3))"
                      fillOpacity={0.3}
                      name="Lotes"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 3 */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Clients by Partner */}
          <Card>
            <CardHeader>
              <CardTitle>Clientes por Parceiro</CardTitle>
              <CardDescription>Top 10 parceiros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.clientsByPartner} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="partner" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} name="Clientes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* PF vs PJ Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição PF vs PJ</CardTitle>
              <CardDescription>Tipo de pessoa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.typeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="count"
                      nameKey="type"
                      label={({ type, percentage }) => `${type}: ${percentage.toFixed(0)}%`}
                      labelLine={false}
                    >
                      {data.typeDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [value, name]}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Product Penetration */}
          <Card>
            <CardHeader>
              <CardTitle>Penetração de Produtos</CardTitle>
              <CardDescription>% de clientes usando cada produto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {data.productPenetration.slice(0, 8).map((product) => (
                  <div key={product.product} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate">{product.product}</span>
                      <span className="text-muted-foreground">{product.clients} ({formatPercent(product.percentage)})</span>
                    </div>
                    <Progress value={product.percentage} className="h-2" />
                  </div>
                ))}
                {data.productPenetration.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem dados de produtos</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ABC Curve */}
        <Card>
          <CardHeader>
            <CardTitle>Curva ABC - Concentração de Receita</CardTitle>
            <CardDescription>Análise de concentração de receita por cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-green-600">Classe A</span>
                  <span className="text-xs text-muted-foreground">80% da receita</span>
                </div>
                <div className="text-2xl font-bold">{data.abcCurve.aClients} clientes</div>
                <div className="text-sm text-muted-foreground">
                  {formatPercent(data.abcCurve.aPercentage)} da base • {formatCurrency(data.abcCurve.aRevenue)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-yellow-600">Classe B</span>
                  <span className="text-xs text-muted-foreground">15% da receita</span>
                </div>
                <div className="text-2xl font-bold">{data.abcCurve.bClients} clientes</div>
                <div className="text-sm text-muted-foreground">
                  {formatPercent(data.abcCurve.bPercentage)} da base • {formatCurrency(data.abcCurve.bRevenue)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-red-600">Classe C</span>
                  <span className="text-xs text-muted-foreground">5% da receita</span>
                </div>
                <div className="text-2xl font-bold">{data.abcCurve.cClients} clientes</div>
                <div className="text-sm text-muted-foreground">
                  {formatPercent(data.abcCurve.cPercentage)} da base • {formatCurrency(data.abcCurve.cRevenue)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
