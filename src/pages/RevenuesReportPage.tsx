import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Loader2, FileDown, DollarSign, TrendingUp, TrendingDown, Users, Receipt, CalendarIcon, ArrowRightLeft } from 'lucide-react';
import { useRevenuesReport, useMonthComparison } from '@/hooks/useRevenuesReport';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '@/lib/utils';

type PeriodType = 'preset' | 'custom';

export default function RevenuesReportPage() {
  const [periodType, setPeriodType] = useState<PeriodType>('preset');
  const [months, setMonths] = useState(12);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [visibleSeries, setVisibleSeries] = useState<string[]>(['gross', 'taxes', 'genial', 'zeve']);
  
  // Month comparison state
  const [compareMonth1, setCompareMonth1] = useState<string | null>(null);
  const [compareMonth2, setCompareMonth2] = useState<string | null>(null);
  
  const reportOptions = useMemo(() => {
    if (periodType === 'custom' && customStartDate && customEndDate) {
      return {
        startDate: format(customStartDate, 'yyyy-MM-dd'),
        endDate: format(customEndDate, 'yyyy-MM-dd'),
      };
    }
    return { months };
  }, [periodType, months, customStartDate, customEndDate]);

  const { data, isLoading, error } = useRevenuesReport(reportOptions);
  const { data: comparisonData, isLoading: isComparing } = useMonthComparison(compareMonth1, compareMonth2);
  const { isSocio } = useAuth();
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text('Relatório de Receitas', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    const periodText = periodType === 'custom' && customStartDate && customEndDate
      ? `${format(customStartDate, 'dd/MM/yyyy')} a ${format(customEndDate, 'dd/MM/yyyy')}`
      : `${months} meses`;
    doc.text(`Período: ${periodText} | Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });

    // Summary
    doc.setFontSize(14);
    doc.text('Resumo Geral', 14, 40);

    autoTable(doc, {
      startY: 45,
      head: [['Métrica', 'Valor']],
      body: [
        ['Receita Bruta', formatCurrency(data.totalGross)],
        ['Impostos', formatCurrency(data.totalTaxes)],
        ['Genial', formatCurrency(data.totalGenial)],
        ['Zeve', formatCurrency(data.totalZeve)],
        ['Ticket Médio', formatCurrency(data.averageTicket)],
        ['Receita/Cliente', formatCurrency(data.revenuePerClient)],
        ['Crescimento MoM', formatPercent(data.momGrowth)],
      ],
    });

    // Top clients
    doc.setFontSize(14);
    doc.text('Top 10 Clientes', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['#', 'Cliente', 'Receita', '% Total']],
      body: data.topClients.map((c, i) => [
        (i + 1).toString(),
        c.name,
        formatCurrency(c.value),
        `${c.percentage.toFixed(1)}%`,
      ]),
    });

    doc.save(`relatorio-receitas-${periodType === 'custom' ? 'personalizado' : months + 'm'}.pdf`);
  };

  const selectedProductData = data?.revenueByProduct.find(p => p.product === selectedProduct);

  const getMonthLabel = (monthKey: string) => {
    const found = data?.availableMonths.find(m => m.key === monthKey);
    return found?.label || monthKey;
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
            <h1 className="text-2xl font-bold">Relatório de Receitas</h1>
            <p className="text-muted-foreground">Análise completa de receitas e MRR</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ToggleGroup 
              type="single" 
              value={periodType} 
              onValueChange={(v) => v && setPeriodType(v as PeriodType)}
              className="border rounded-md"
            >
              <ToggleGroupItem value="preset" className="text-xs">Predefinido</ToggleGroupItem>
              <ToggleGroupItem value="custom" className="text-xs">Personalizado</ToggleGroupItem>
            </ToggleGroup>

            {periodType === 'preset' ? (
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
            ) : (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !customStartDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, 'dd/MM/yyyy') : 'Início'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">até</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !customEndDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, 'dd/MM/yyyy') : 'Fim'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <Button onClick={exportToPDF} variant="outline">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Month Comparison Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              <CardTitle>Comparar Meses</CardTitle>
            </div>
            <CardDescription>Compare métricas entre dois meses específicos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label>Mês 1:</Label>
                  <Select value={compareMonth1 || ''} onValueChange={(v) => setCompareMonth1(v || null)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {data.availableMonths.map((m) => (
                        <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <span className="text-muted-foreground font-bold">vs</span>

                <div className="flex items-center gap-2">
                  <Label>Mês 2:</Label>
                  <Select value={compareMonth2 || ''} onValueChange={(v) => setCompareMonth2(v || null)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {data.availableMonths.map((m) => (
                        <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(compareMonth1 || compareMonth2) && (
                  <Button variant="ghost" size="sm" onClick={() => { setCompareMonth1(null); setCompareMonth2(null); }}>
                    Limpar
                  </Button>
                )}
              </div>

              {isComparing && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {comparisonData && !isComparing && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Métrica</TableHead>
                        <TableHead className="text-right">{getMonthLabel(comparisonData.month1.key)}</TableHead>
                        <TableHead className="text-right">{getMonthLabel(comparisonData.month2.key)}</TableHead>
                        <TableHead className="text-right">Variação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Receita Bruta</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(comparisonData.month1.metrics.gross)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(comparisonData.month2.metrics.gross)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={comparisonData.variation.gross.percent >= 0 ? 'default' : 'destructive'}>
                            {formatPercent(comparisonData.variation.gross.percent)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Impostos</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(comparisonData.month1.metrics.taxes)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(comparisonData.month2.metrics.taxes)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={comparisonData.variation.taxes.percent <= 0 ? 'default' : 'destructive'}>
                            {formatPercent(comparisonData.variation.taxes.percent)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Genial</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(comparisonData.month1.metrics.genial)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(comparisonData.month2.metrics.genial)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={comparisonData.variation.genial.percent >= 0 ? 'default' : 'destructive'}>
                            {formatPercent(comparisonData.variation.genial.percent)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Zeve</TableCell>
                        <TableCell className="text-right font-mono text-primary">{formatCurrency(comparisonData.month1.metrics.zeve)}</TableCell>
                        <TableCell className="text-right font-mono text-primary">{formatCurrency(comparisonData.month2.metrics.zeve)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={comparisonData.variation.zeve.percent >= 0 ? 'default' : 'destructive'}>
                            {formatPercent(comparisonData.variation.zeve.percent)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Clientes Ativos</TableCell>
                        <TableCell className="text-right font-mono">{comparisonData.month1.metrics.clients}</TableCell>
                        <TableCell className="text-right font-mono">{comparisonData.month2.metrics.clients}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={comparisonData.variation.clients.percent >= 0 ? 'default' : 'destructive'}>
                            {formatPercent(comparisonData.variation.clients.percent)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Transações</TableCell>
                        <TableCell className="text-right font-mono">{comparisonData.month1.metrics.transactions}</TableCell>
                        <TableCell className="text-right font-mono">{comparisonData.month2.metrics.transactions}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={comparisonData.variation.transactions.percent >= 0 ? 'default' : 'destructive'}>
                            {formatPercent(comparisonData.variation.transactions.percent)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {!compareMonth1 && !compareMonth2 && !isComparing && (
                <div className="text-center py-6 text-muted-foreground">
                  Selecione dois meses para comparar as métricas
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards Row 1 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.totalGross)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Impostos</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(data.totalTaxes)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Genial</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.totalGenial)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Zeve</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(data.totalZeve)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards Row 2 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.averageTicket)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita/Cliente</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.revenuePerClient)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Crescimento MoM</CardTitle>
              {data.momGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data.momGrowth >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {formatPercent(data.momGrowth)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.activeClientsCount}</div>
              <p className="text-xs text-muted-foreground">Com receita no período</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Evolution Chart */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Evolução Mensal da Receita</CardTitle>
                <CardDescription>Selecione quais métricas exibir no gráfico</CardDescription>
              </div>
              <ToggleGroup 
                type="multiple" 
                value={visibleSeries} 
                onValueChange={(value) => value.length > 0 && setVisibleSeries(value)}
                className="justify-start"
              >
                <ToggleGroupItem value="gross" aria-label="Bruto" className="data-[state=on]:bg-[hsl(var(--chart-1))]/20 data-[state=on]:text-[hsl(var(--chart-1))]">
                  Bruto
                </ToggleGroupItem>
                <ToggleGroupItem value="taxes" aria-label="Impostos" className="data-[state=on]:bg-[hsl(var(--chart-2))]/20 data-[state=on]:text-[hsl(var(--chart-2))]">
                  Impostos
                </ToggleGroupItem>
                <ToggleGroupItem value="genial" aria-label="Genial" className="data-[state=on]:bg-[hsl(var(--chart-3))]/20 data-[state=on]:text-[hsl(var(--chart-3))]">
                  Genial
                </ToggleGroupItem>
                <ToggleGroupItem value="zeve" aria-label="Zeve" className="data-[state=on]:bg-primary/20 data-[state=on]:text-primary">
                  Zeve
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyEvolution}>
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  {visibleSeries.includes('gross') && (
                    <Area type="monotone" dataKey="gross" name="Bruto" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.2} />
                  )}
                  {visibleSeries.includes('taxes') && (
                    <Area type="monotone" dataKey="taxes" name="Impostos" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.2} />
                  )}
                  {visibleSeries.includes('genial') && (
                    <Area type="monotone" dataKey="genial" name="Genial" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.2} />
                  )}
                  {visibleSeries.includes('zeve') && (
                    <Area type="monotone" dataKey="zeve" name="Zeve" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* MRR Components Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Componentes do MRR</CardTitle>
            <CardDescription>Novo, Expansão, Contração e Churn mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.mrrComponents}>
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => formatCurrency(Math.abs(v))} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      
                      const novo = (payload.find(p => p.dataKey === 'novo')?.value as number) || 0;
                      const expansao = (payload.find(p => p.dataKey === 'expansao')?.value as number) || 0;
                      const contracao = Math.abs((payload.find(p => p.dataKey === 'contracao')?.value as number) || 0);
                      const churn = Math.abs((payload.find(p => p.dataKey === 'churn')?.value as number) || 0);
                      const saldo = novo + expansao - contracao - churn;
                      
                      return (
                        <div className="rounded-lg border bg-card p-3 shadow-md">
                          <p className="font-medium mb-2">{label}</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Novo:</span>
                              <span className="font-medium" style={{ color: 'hsl(210, 100%, 70%)' }}>{formatCurrency(novo)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Expansão:</span>
                              <span className="font-medium" style={{ color: 'hsl(210, 80%, 50%)' }}>{formatCurrency(expansao)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Contração:</span>
                              <span className="font-medium text-muted-foreground">-{formatCurrency(contracao)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Churn:</span>
                              <span className="font-medium text-destructive">-{formatCurrency(churn)}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between gap-4 font-semibold">
                              <span>Saldo Líquido:</span>
                              <span className={saldo >= 0 ? 'text-green-500' : 'text-destructive'}>
                                {saldo >= 0 ? '+' : ''}{formatCurrency(saldo)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                  <Bar dataKey="novo" name="Novo" stackId="positive" fill="hsl(210, 100%, 70%)" />
                  <Bar dataKey="expansao" name="Expansão" stackId="positive" fill="hsl(210, 80%, 50%)" />
                  <Bar dataKey="contracao" name="Contração" stackId="negative" fill="hsl(var(--muted-foreground))" />
                  <Bar dataKey="churn" name="Churn" stackId="negative" fill="hsl(var(--destructive))" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Partner and Assessor */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Receita por Parceiro</CardTitle>
              <CardDescription>Top 10 parceiros por receita</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.revenueByPartner} layout="vertical">
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis type="category" dataKey="partner" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Receita']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {isSocio && (
            <Card>
              <CardHeader>
                <CardTitle>Receita por Assessor</CardTitle>
                <CardDescription>Distribuição de receita por assessor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.revenueByAssessor} layout="vertical">
                      <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                      <YAxis type="category" dataKey="assessor" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Receita']}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {!isSocio && (
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Clientes</CardTitle>
                <CardDescription>Maiores clientes por receita</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topClients} layout="vertical">
                      <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Receita']}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Revenue by Product */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Produto</CardTitle>
            <CardDescription>Clique em um produto para ver detalhes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.revenueByProduct.map((product, index) => (
                <button
                  key={product.product}
                  onClick={() => setSelectedProduct(product.product)}
                  className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium truncate">{product.product}</span>
                    {index < 3 && (
                      <Badge variant="secondary" className="ml-2">
                        #{index + 1}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xl font-bold text-primary">{formatCurrency(product.value)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {data.totalZeve > 0 ? ((product.value / data.totalZeve) * 100).toFixed(1) : 0}% do total
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Subproduct */}
        {data.revenueBySubproduct.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Receita por Subproduto</CardTitle>
              <CardDescription>Top 10 subprodutos por receita (Zeve)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={data.revenueBySubproduct} 
                    layout="vertical"
                    margin={{ left: 20, right: 20 }}
                  >
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis 
                      type="category" 
                      dataKey="subproduct" 
                      width={150}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Receita']}
                      labelFormatter={(label) => {
                        const item = data.revenueBySubproduct.find(s => s.subproduct === label);
                        return `${label} (${item?.product || ''})`;
                      }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="hsl(var(--chart-5))" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Clients Table */}
        {isSocio && (
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Clientes por Receita</CardTitle>
              <CardDescription>Clientes que mais contribuem para a receita</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">% Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topClients.map((client, index) => (
                    <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/clients/${client.id}`)}>
                      <TableCell>
                        {index === 0 && <span className="text-yellow-500">🥇</span>}
                        {index === 1 && <span className="text-gray-400">🥈</span>}
                        {index === 2 && <span className="text-amber-600">🥉</span>}
                        {index > 2 && <span className="text-muted-foreground">{index + 1}</span>}
                      </TableCell>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(client.value)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{client.percentage.toFixed(1)}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Product Detail Dialog */}
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedProduct}</DialogTitle>
            </DialogHeader>
            {selectedProductData && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-primary">{formatCurrency(selectedProductData.value)}</div>
                      <p className="text-xs text-muted-foreground">Receita Total</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {data.totalZeve > 0 ? ((selectedProductData.value / data.totalZeve) * 100).toFixed(1) : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">% do Total</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{selectedProductData.topClients.length}</div>
                      <p className="text-xs text-muted-foreground">Clientes</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedProductData.monthlyData}>
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Receita']}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Top Clientes deste Produto</h4>
                  <div className="space-y-2">
                    {selectedProductData.topClients.map((client, i) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted"
                        onClick={() => {
                          setSelectedProduct(null);
                          navigate(`/clients/${client.id}`);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          <span className="font-medium">{client.name}</span>
                        </div>
                        <span className="font-mono text-sm">{formatCurrency(client.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
