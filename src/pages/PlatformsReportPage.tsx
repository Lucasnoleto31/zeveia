import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Monitor, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users,
  Download,
  Target,
  Layers,
  Award,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  Legend,
} from 'recharts';
import { usePlatformsReport } from '@/hooks/usePlatformsReport';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', '#8884d8', '#82ca9d', '#ffc658'];

export default function PlatformsReportPage() {
  const [months, setMonths] = useState('12');
  const { data, isLoading, error } = usePlatformsReport(parseInt(months));
  const { isSocio } = useAuth();
  const navigate = useNavigate();

  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text('Relatório de Plataformas', 14, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(`Período: Últimos ${months} meses`, 14, y);
    y += 15;

    // Summary
    doc.setFontSize(14);
    doc.text('Resumo', 14, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total Plataformas', data.totalPlatforms.toString()],
        ['Custo Total', formatCurrency(data.totalCost)],
        ['Custo Médio Mensal', formatCurrency(data.avgMonthlyCost)],
        ['Plataforma Mais Contratada', data.mostContractedPlatform],
        ['Crescimento MoM', `${data.momGrowth >= 0 ? '+' : ''}${data.momGrowth.toFixed(1)}%`],
      ],
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // Platform stats
    doc.setFontSize(14);
    doc.text('Por Plataforma', 14, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [['Plataforma', 'Clientes', 'Custo Total', 'Custo/Cliente', 'Lotes', 'Custo/Lote']],
      body: data.platformStats.slice(0, 10).map(p => [
        p.name,
        p.clientCount.toString(),
        formatCurrency(p.totalCost),
        formatCurrency(p.avgCostPerClient),
        p.lotsTraded.toString(),
        p.lotsTraded > 0 ? formatCurrency(p.costPerLot) : '-',
      ]),
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // Top clients
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.text('Top 10 Clientes por Custo', 14, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [['Cliente', 'Custo Total', 'Plataformas']],
      body: data.topClientsByCost.map(c => [
        c.name,
        formatCurrency(c.totalCost),
        c.platformCount.toString(),
      ]),
    });

    doc.save('relatorio-plataformas.pdf');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (isLoading) {
    return (
      <MainLayout title="Relatório de Plataformas">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout title="Relatório de Plataformas">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Não foi possível carregar os dados do relatório.
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Relatório de Plataformas">
      <p className="text-muted-foreground mb-6">Análise completa de custos e uso de plataformas</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
        <div className="flex items-center gap-4">
          <Select value={months} onValueChange={setMonths}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
              <SelectItem value="24">Últimos 24 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={exportToPDF} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              Total Plataformas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalPlatforms}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Custo Total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalCost)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Custo Médio/Mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.avgMonthlyCost)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              Mais Contratada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{data.mostContractedPlatform}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Custo/Lote Médio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.avgCostPerLot)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              {data.momGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              Crescimento MoM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.momGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.momGrowth >= 0 ? '+' : ''}{data.momGrowth.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Platforms by Client Count */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plataformas Mais Contratadas</CardTitle>
            <CardDescription>Número de clientes por plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.platformStats.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [value, 'Clientes']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                />
                <Bar dataKey="clientCount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost by Platform - Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custo por Plataforma</CardTitle>
            <CardDescription>Distribuição do custo total</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.platformStats.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="totalCost"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.platformStats.slice(0, 6).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Custo']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Evolution */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Evolução Mensal</CardTitle>
          <CardDescription>Custo e número de clientes ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={data.monthlyEvolution}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis yAxisId="left" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'totalCost' ? formatCurrency(value) : value,
                  name === 'totalCost' ? 'Custo Total' : 'Clientes Ativos'
                ]}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="totalCost" name="Custo Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="clientCount" name="Clientes Ativos" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* By State and Partner */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* By State */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custo por Estado</CardTitle>
            <CardDescription>Top 10 estados por custo total</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.stateStats.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="state" type="category" width={60} className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Custo']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                />
                <Bar dataKey="totalCost" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Partner */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custo por Parceiro</CardTitle>
            <CardDescription>Parceiros com maior custo de plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            {data.partnerStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.partnerStats.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Custo']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  />
                  <Bar dataKey="totalCost" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum dado de parceiro encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Efficiency Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Cost per Lot by Platform */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Eficiência por Plataforma</CardTitle>
            <CardDescription>Custo por lote girado (menor = mais eficiente)</CardDescription>
          </CardHeader>
          <CardContent>
            {data.platformStats.filter(p => p.lotsTraded > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={data.platformStats
                    .filter(p => p.lotsTraded > 0)
                    .sort((a, b) => a.costPerLot - b.costPerLot)
                    .slice(0, 8)
                  } 
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => `R$ ${v.toFixed(2)}`} />
                  <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Custo/Lote']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  />
                  <Bar dataKey="costPerLot" fill="hsl(var(--chart-5))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum dado de lotes encontrado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights Cards */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Clientes Multi-plataforma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.multiPlatformClients}</div>
              <p className="text-sm text-muted-foreground">
                {data.multiPlatformClientsPercent.toFixed(1)}% dos clientes usam mais de uma plataforma
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Concentração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.topPlatformConcentration.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">
                dos clientes usam {data.mostContractedPlatform}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Novos Contratos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.newContractsThisMonth}</div>
              <p className="text-sm text-muted-foreground">
                novas contratações este mês
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assessor Stats - Only for Socios */}
      {isSocio && data.assessorStats.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Custo por Assessor</CardTitle>
            <CardDescription>Distribuição de custos de plataforma por assessor</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.assessorStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'totalCost' ? formatCurrency(value) : 
                    name === 'avgCostPerClient' ? formatCurrency(value) : value,
                    name === 'totalCost' ? 'Custo Total' : 
                    name === 'avgCostPerClient' ? 'Custo Médio/Cliente' : 'Clientes'
                  ]}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                />
                <Legend />
                <Bar dataKey="totalCost" name="Custo Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Clients Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Top 10 Clientes por Custo de Plataforma</CardTitle>
          <CardDescription>Clientes com maior investimento em plataformas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
                <TableHead className="text-center">Plataformas</TableHead>
                <TableHead className="text-right">Custo/Plataforma</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topClientsByCost.map((client, index) => (
                <TableRow 
                  key={client.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <TableCell>
                    {index < 3 ? (
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        {index + 1}º
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">{index + 1}º</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(client.totalCost)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{client.platformCount}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(client.avgCostPerPlatform)}</TableCell>
                </TableRow>
              ))}
              {data.topClientsByCost.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum dado de cliente encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Platform Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhes por Plataforma</CardTitle>
          <CardDescription>Métricas completas de cada plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plataforma</TableHead>
                <TableHead className="text-center">Clientes</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
                <TableHead className="text-right">Custo/Cliente</TableHead>
                <TableHead className="text-right">Lotes Girados</TableHead>
                <TableHead className="text-right">Custo/Lote</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.platformStats.map((platform) => (
                <TableRow key={platform.id}>
                  <TableCell className="font-medium">{platform.name}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{platform.clientCount}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(platform.totalCost)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(platform.avgCostPerClient)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(platform.lotsTraded)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {platform.lotsTraded > 0 ? formatCurrency(platform.costPerLot) : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {data.platformStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma plataforma encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
