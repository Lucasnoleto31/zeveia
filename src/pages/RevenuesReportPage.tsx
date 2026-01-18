import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileDown, DollarSign, TrendingUp, TrendingDown, Users, Receipt, Percent } from 'lucide-react';
import { useRevenuesReport } from '@/hooks/useRevenuesReport';
import { useAuth } from '@/contexts/AuthContext';
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
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function RevenuesReportPage() {
  const [months, setMonths] = useState(12);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const { data, isLoading, error } = useRevenuesReport(months);
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
    doc.text(`Período: ${months} meses | Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });

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

    doc.save(`relatorio-receitas-${months}m.pdf`);
  };

  const selectedProductData = data?.revenueByProduct.find(p => p.product === selectedProduct);

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
            <CardTitle>Evolução Mensal da Receita</CardTitle>
            <CardDescription>Comparativo entre Receita Bruta, Impostos, Genial e Zeve</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="gross" name="Bruto" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="taxes" name="Impostos" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="genial" name="Genial" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="zeve" name="Zeve" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
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
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => formatCurrency(Math.abs(v))} />
                  <Tooltip
                    formatter={(value: number, name: string) => [formatCurrency(Math.abs(value)), name]}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
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
                    <CartesianGrid strokeDasharray="3 3" />
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
                      <CartesianGrid strokeDasharray="3 3" />
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
                      <CartesianGrid strokeDasharray="3 3" />
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
                      <CartesianGrid strokeDasharray="3 3" />
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
