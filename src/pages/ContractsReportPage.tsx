import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useContractsReport } from '@/hooks/useContractsReport';
import { useAuth } from '@/contexts/AuthContext';
import { FileBarChart, Download, Loader2, TrendingUp, TrendingDown, Users, FileText, BarChart3, Percent, Clock, PieChart as PieChartIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PeriodFilter, getPeriodLabel } from '@/components/reports/PeriodFilter';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ContractsReportPage() {
  const [periodType, setPeriodType] = useState<'preset' | 'custom'>('preset');
  const [months, setMonths] = useState(12);
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [chartMode, setChartMode] = useState<'absolute' | 'rate'>('absolute');
  
  const { data, isLoading, error } = useContractsReport(
    periodType === 'custom' && customStartDate && customEndDate
      ? { startDate: format(customStartDate, 'yyyy-MM-dd'), endDate: format(customEndDate, 'yyyy-MM-dd') }
      : { months }
  );
  const { isSocio } = useAuth();
  const navigate = useNavigate();

  const periodLabel = getPeriodLabel(periodType, months, customStartDate, customEndDate);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(value));
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Title
    doc.setFontSize(18);
    doc.text('Relatório de Contratos', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Período: ${periodLabel}`, pageWidth / 2, 28, { align: 'center' });

    // Summary
    doc.setFontSize(12);
    doc.text('Resumo', 14, 40);

    autoTable(doc, {
      startY: 45,
      head: [['Métrica', 'Valor']],
      body: [
        ['Lotes Girados', formatNumber(data.totalTraded)],
        ['Lotes Zerados', formatNumber(data.totalZeroed)],
        ['Taxa de Zeragem', formatPercent(data.zeroRate)],
        ['Total de Registros', formatNumber(data.totalRecords)],
        ['Clientes Ativos', formatNumber(data.activeClientsCount)],
        ['Média por Cliente', formatNumber(data.avgLotsPerClient)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Monthly evolution
    const finalY1 = (doc as any).lastAutoTable.finalY || 90;
    doc.text('Evolução Mensal', 14, finalY1 + 10);

    autoTable(doc, {
      startY: finalY1 + 15,
      head: [['Mês', 'Girados', 'Zerados', 'Taxa Zeragem']],
      body: data.monthlyEvolution.map(m => [
        m.month,
        formatNumber(m.traded),
        formatNumber(m.zeroed),
        formatPercent(m.zeroRate),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Top clients
    const finalY2 = (doc as any).lastAutoTable.finalY || 150;
    if (finalY2 > 240) doc.addPage();

    const startY3 = finalY2 > 240 ? 20 : finalY2 + 10;
    doc.text('Top 10 Clientes - Mais Giraram', 14, startY3);

    autoTable(doc, {
      startY: startY3 + 5,
      head: [['Posição', 'Cliente', 'Lotes']],
      body: data.topByTraded.map((c, i) => [
        `${i + 1}º`,
        c.name,
        formatNumber(c.value),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`relatorio-contratos-${months}m.pdf`);
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

  if (error || !data) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Erro ao carregar dados do relatório</p>
        </div>
      </MainLayout>
    );
  }

  const getMedalColor = (position: number) => {
    switch (position) {
      case 0: return 'bg-yellow-500';
      case 1: return 'bg-gray-400';
      case 2: return 'bg-amber-600';
      default: return 'bg-muted';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileBarChart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Relatório de Contratos</h1>
              <p className="text-sm text-muted-foreground">Análise de lotes girados e zeragem</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PeriodFilter
              periodType={periodType}
              onPeriodTypeChange={setPeriodType}
              months={months}
              onMonthsChange={setMonths}
              customStartDate={customStartDate}
              onCustomStartDateChange={setCustomStartDate}
              customEndDate={customEndDate}
              onCustomEndDateChange={setCustomEndDate}
              presetOptions={[
                { value: 3, label: 'Últimos 3 meses' },
                { value: 6, label: 'Últimos 6 meses' },
                { value: 12, label: 'Últimos 12 meses' },
                { value: 24, label: 'Últimos 24 meses' },
              ]}
            />
            <Button onClick={exportToPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Lotes Girados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatNumber(data.totalTraded)}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {data.momGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={data.momGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {formatPercent(Math.abs(data.momGrowth))} MoM
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Lotes Zerados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.totalZeroed)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Taxa de Zeragem</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercent(data.zeroRate)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Registros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.totalRecords)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Clientes Ativos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.activeClientsCount)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Média/Cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.avgLotsPerClient)}</div>
              <p className="text-xs text-muted-foreground">lotes/cliente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Concentração Top 10</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercent(data.top10Concentration)}</div>
              <p className="text-xs text-muted-foreground">do volume total</p>
            </CardContent>
          </Card>
        </div>

        {/* Volume Distribution and Inactive Clients */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Volume Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Distribuição por Faixa de Volume
              </CardTitle>
              <CardDescription>Quantidade de clientes por faixa de lotes girados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.volumeDistribution.map((item) => (
                  <div key={item.range} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.range} lotes</span>
                      <span className="text-muted-foreground">
                        {item.count} clientes ({formatPercent(item.percentage)})
                      </span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Inactive Clients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-destructive" />
                Clientes Inativos em Day Trade
              </CardTitle>
              <CardDescription>Clientes sem operações há mais de 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              {data.inactiveClients.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhum cliente inativo encontrado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Dias</TableHead>
                      <TableHead className="text-right">Última Op.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.inactiveClients.slice(0, 8).map((client) => (
                      <TableRow 
                        key={client.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        <TableCell className="font-medium truncate max-w-[120px]">
                          {client.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={client.daysSinceLastOp > 60 ? 'destructive' : 'secondary'}>
                            {client.daysSinceLastOp}d
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">
                          {new Date(client.lastOpDate).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Evolution Chart */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Evolução Mensal</CardTitle>
                <CardDescription>Lotes girados e zerados ao longo do tempo</CardDescription>
              </div>
              <ToggleGroup 
                type="single" 
                value={chartMode} 
                onValueChange={(v) => v && setChartMode(v as 'absolute' | 'rate')}
              >
                <ToggleGroupItem value="absolute" aria-label="Valores Absolutos">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Absoluto
                </ToggleGroupItem>
                <ToggleGroupItem value="rate" aria-label="Taxa de Zeragem">
                  <Percent className="h-4 w-4 mr-1" />
                  Taxa
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'absolute' ? (
                  <BarChart data={data.monthlyEvolution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => formatNumber(v)} />
                    <Tooltip
                      formatter={(value: number) => formatNumber(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar dataKey="traded" name="Girados" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="zeroed" name="Zerados" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={data.monthlyEvolution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      formatter={(value: number) => formatPercent(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="zeroRate" 
                      name="Taxa de Zeragem" 
                      stroke="hsl(var(--chart-3))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-3))' }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Partner and Platform */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Por Parceiro</CardTitle>
              <CardDescription>Top 10 parceiros por lotes girados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byPartner} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" tickFormatter={(v) => formatNumber(v)} />
                    <YAxis type="category" dataKey="name" className="text-xs" width={100} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === 'zeroRate' ? formatPercent(value) : formatNumber(value),
                        name === 'traded' ? 'Girados' : name === 'zeroed' ? 'Zerados' : 'Taxa'
                      ]}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="traded" name="Girados" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Por Plataforma</CardTitle>
              <CardDescription>Distribuição por plataforma de operação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byPlatform} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" tickFormatter={(v) => formatNumber(v)} />
                    <YAxis type="category" dataKey="name" className="text-xs" width={100} />
                    <Tooltip
                      formatter={(value: number) => formatNumber(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="traded" name="Girados" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="zeroed" name="Zerados" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* By Asset and State */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Por Ativo</CardTitle>
              <CardDescription>Distribuição por código do ativo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byAsset}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => formatNumber(v)} />
                    <Tooltip
                      formatter={(value: number) => formatNumber(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar dataKey="traded" name="Girados" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="zeroed" name="Zerados" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Por Estado</CardTitle>
              <CardDescription>Top 10 estados por lotes girados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byState} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" tickFormatter={(v) => formatNumber(v)} />
                    <YAxis type="category" dataKey="name" className="text-xs" width={60} />
                    <Tooltip
                      formatter={(value: number) => formatNumber(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="traded" name="Girados" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* By Assessor - Only for Sócio */}
        {isSocio && data.byAssessor.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Por Assessor</CardTitle>
              <CardDescription>Desempenho por assessor da equipe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.byAssessor} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" tickFormatter={(v) => formatNumber(v)} />
                    <YAxis type="category" dataKey="name" className="text-xs" width={120} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === 'zeroRate' ? formatPercent(value) : formatNumber(value),
                        name === 'traded' ? 'Girados' : name === 'zeroed' ? 'Zerados' : 'Taxa'
                      ]}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar dataKey="traded" name="Girados" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="zeroed" name="Zerados" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 10 Rankings */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Top by Traded */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top 10 - Mais Giraram
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Lotes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topByTraded.map((client, index) => (
                    <TableRow 
                      key={client.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <TableCell>
                        <Badge className={`${getMedalColor(index)} text-white`}>
                          {index + 1}º
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium truncate max-w-[120px]">
                        {client.name}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {formatNumber(client.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top by Zeroed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                Top 10 - Mais Zeraram
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Lotes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topByZeroed.map((client, index) => (
                    <TableRow 
                      key={client.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <TableCell>
                        <Badge className={`${getMedalColor(index)} text-white`}>
                          {index + 1}º
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium truncate max-w-[120px]">
                        {client.name}
                      </TableCell>
                      <TableCell className="text-right font-bold text-destructive">
                        {formatNumber(client.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top by Best Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-chart-3" />
                Top 10 - Maior Taxa
              </CardTitle>
              <CardDescription>Mínimo 100 lotes girados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Taxa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topByBestRate.map((client, index) => (
                    <TableRow 
                      key={client.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <TableCell>
                        <Badge className={`${getMedalColor(index)} text-white`}>
                          {index + 1}º
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium truncate max-w-[120px]">
                        {client.name}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatPercent(client.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
