import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { 
  Filter, 
  Download, 
  Loader2, 
  BarChart3, 
  Trophy,
  Users,
  DollarSign,
  TrendingUp,
  Target,
  Medal
} from 'lucide-react';
import { usePerformanceReport } from '@/hooks/usePerformanceReport';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4', '#ec4899'];

export default function PerformanceReportPage() {
  const [months, setMonths] = useState(6);
  const [selectedAssessor, setSelectedAssessor] = useState<string | null>(null);
  const { data, isLoading } = usePerformanceReport(months);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.text('Relatório de Performance', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Período: Últimos ${months} meses`, pageWidth / 2, 30, { align: 'center' });

    // Ranking table
    doc.setFontSize(14);
    doc.text('Ranking de Assessores', 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [['Pos.', 'Assessor', 'Clientes', 'Receita', 'Conv.', 'Score']],
      body: data.assessors.map((a) => [
        `#${a.ranking}`,
        a.name,
        a.totalClients.toString(),
        formatCurrency(a.totalRevenue),
        `${a.conversionRate.toFixed(1)}%`,
        a.score.toFixed(1),
      ]),
    });

    // Totals
    const totalsY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Totais do Escritório', 14, totalsY);

    autoTable(doc, {
      startY: totalsY + 5,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Clientes', data.totals.clients.toString()],
        ['Novos Clientes', data.totals.newClients.toString()],
        ['Leads Convertidos', data.totals.convertedLeads.toString()],
        ['Receita Total', formatCurrency(data.totals.revenue)],
        ['Patrimônio Total', formatCurrency(data.totals.patrimony)],
      ],
    });

    doc.save('relatorio-performance.pdf');
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
          <p className="text-muted-foreground">Erro ao carregar dados de performance</p>
        </div>
      </MainLayout>
    );
  }

  // Prepare chart data for monthly evolution
  const monthlyData = data.evolution.reduce((acc, item) => {
    const existing = acc.find(a => a.month === item.month);
    if (existing) {
      existing[item.assessorName] = item.revenue;
    } else {
      acc.push({ month: item.month, [item.assessorName]: item.revenue });
    }
    return acc;
  }, [] as Record<string, any>[]);

  // Radar chart data for selected assessor
  const selectedMetrics = selectedAssessor 
    ? data.assessors.find(a => a.id === selectedAssessor)
    : data.assessors[0];

  const radarData = selectedMetrics ? [
    { metric: 'Clientes', value: (selectedMetrics.totalClients / Math.max(...data.assessors.map(a => a.totalClients), 1)) * 100 },
    { metric: 'Receita', value: (selectedMetrics.totalRevenue / Math.max(...data.assessors.map(a => a.totalRevenue), 1)) * 100 },
    { metric: 'Conversão', value: selectedMetrics.conversionRate },
    { metric: 'Patrimônio', value: (selectedMetrics.totalPatrimony / Math.max(...data.assessors.map(a => a.totalPatrimony), 1)) * 100 },
    { metric: 'Lotes', value: (selectedMetrics.lotsTraded / Math.max(...data.assessors.map(a => a.lotsTraded), 1)) * 100 },
  ] : [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Performance</h1>
              <p className="text-sm text-muted-foreground">
                Comparativo de desempenho entre assessores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={months.toString()} onValueChange={(v) => setMonths(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.topPerformers.revenue && (
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/50">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Maior Receita</p>
                    <p className="font-bold">{data.topPerformers.revenue.name}</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      {formatCurrency(data.topPerformers.revenue.totalRevenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {data.topPerformers.conversion && (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Melhor Conversão</p>
                    <p className="font-bold">{data.topPerformers.conversion.name}</p>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      {data.topPerformers.conversion.conversionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {data.topPerformers.clients && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mais Clientes</p>
                    <p className="font-bold">{data.topPerformers.clients.name}</p>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      {data.topPerformers.clients.totalClients} clientes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Office Totals */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{data.totals.clients}</p>
              <p className="text-xs text-muted-foreground">Clientes Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{data.totals.newClients}</p>
              <p className="text-xs text-muted-foreground">Novos Clientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{data.totals.convertedLeads}</p>
              <p className="text-xs text-muted-foreground">Leads Convertidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(data.totals.revenue)}</p>
              <p className="text-xs text-muted-foreground">Receita Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{data.totals.lotsTraded.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">Lotes Negociados</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Evolution */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Receita Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
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
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  {data.assessors.map((assessor, index) => (
                    <Line
                      key={assessor.id}
                      type="monotone"
                      dataKey={assessor.name}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Perfil de Performance</CardTitle>
              <Select 
                value={selectedAssessor || data.assessors[0]?.id || ''} 
                onValueChange={setSelectedAssessor}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecionar assessor" />
                </SelectTrigger>
                <SelectContent>
                  {data.assessors.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis dataKey="metric" className="text-xs" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} className="text-xs" />
                  <Radar
                    name={selectedMetrics?.name || ''}
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Comparative Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Comparativo de Receita por Assessor</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.assessors}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
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
                  formatter={(value: number, name: string) => [
                    name === 'totalRevenue' ? formatCurrency(value) : value,
                    name === 'totalRevenue' ? 'Receita' : name === 'monthlyRevenue' ? 'Receita Mensal' : name
                  ]}
                />
                <Legend />
                <Bar 
                  dataKey="totalRevenue" 
                  name="Receita Total" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey="monthlyRevenue" 
                  name="Receita Mês Atual" 
                  fill="#22c55e" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ranking Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5" />
              Ranking de Assessores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Pos.</th>
                    <th className="text-left py-3 px-4 font-medium">Assessor</th>
                    <th className="text-center py-3 px-4 font-medium">Clientes</th>
                    <th className="text-center py-3 px-4 font-medium">Novos</th>
                    <th className="text-center py-3 px-4 font-medium">Leads</th>
                    <th className="text-center py-3 px-4 font-medium">Conv.</th>
                    <th className="text-right py-3 px-4 font-medium">Receita</th>
                    <th className="text-right py-3 px-4 font-medium">Ticket Médio</th>
                    <th className="text-center py-3 px-4 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.assessors.map((assessor) => (
                    <tr 
                      key={assessor.id} 
                      className={cn(
                        'border-b last:border-0 transition-colors',
                        assessor.ranking === 1 && 'bg-yellow-50 dark:bg-yellow-950/20',
                        assessor.ranking === 2 && 'bg-gray-50 dark:bg-gray-950/20',
                        assessor.ranking === 3 && 'bg-orange-50 dark:bg-orange-950/20'
                      )}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {assessor.ranking <= 3 ? (
                            <Badge 
                              variant="outline"
                              className={cn(
                                'font-bold',
                                assessor.ranking === 1 && 'border-yellow-500 text-yellow-600',
                                assessor.ranking === 2 && 'border-gray-400 text-gray-500',
                                assessor.ranking === 3 && 'border-orange-500 text-orange-600'
                              )}
                            >
                              #{assessor.ranking}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">#{assessor.ranking}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {assessor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{assessor.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">{assessor.totalClients}</td>
                      <td className="text-center py-3 px-4 text-green-600">+{assessor.newClients}</td>
                      <td className="text-center py-3 px-4">
                        {assessor.totalLeads}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({assessor.convertedLeads} conv.)
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={cn(
                          'font-medium',
                          assessor.conversionRate >= 30 ? 'text-green-600' :
                          assessor.conversionRate >= 15 ? 'text-yellow-600' : 'text-red-600'
                        )}>
                          {assessor.conversionRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 font-medium">
                        {formatCurrency(assessor.totalRevenue)}
                      </td>
                      <td className="text-right py-3 px-4 text-muted-foreground">
                        {formatCurrency(assessor.avgTicket)}
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-primary transition-all"
                              style={{ width: `${assessor.score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-10">
                            {assessor.score.toFixed(0)}
                          </span>
                        </div>
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
