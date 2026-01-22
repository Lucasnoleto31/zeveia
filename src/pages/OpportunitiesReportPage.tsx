import { useState } from 'react';
import { format } from 'date-fns';
import { Download, Target, TrendingUp, Users, Package, Megaphone, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PeriodFilter, getPeriodLabel } from '@/components/reports/PeriodFilter';
import { useOpportunitiesReport } from '@/hooks/useOpportunitiesReport';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function OpportunitiesReportPage() {
  const [periodType, setPeriodType] = useState<'preset' | 'custom'>('preset');
  const [months, setMonths] = useState(6);
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  const { data, isLoading } = useOpportunitiesReport(
    periodType === 'custom' && customStartDate && customEndDate
      ? { startDate: format(customStartDate, 'yyyy-MM-dd'), endDate: format(customEndDate, 'yyyy-MM-dd') }
      : { months }
  );

  const periodLabel = getPeriodLabel(periodType, months, customStartDate, customEndDate);

  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório de Oportunidades', 14, 22);
    doc.setFontSize(11);
    doc.text(`Período: ${periodLabel}`, 14, 32);

    // Summary
    doc.setFontSize(14);
    doc.text('Resumo Geral', 14, 45);
    autoTable(doc, {
      startY: 50,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Oportunidades', data.totalOpportunities.toString()],
        ['Convertidas', data.convertedOpportunities.toString()],
        ['Perdidas', data.lostOpportunities.toString()],
        ['Em Andamento', data.activeOpportunities.toString()],
        ['Taxa de Conversão', `${data.conversionRate.toFixed(1)}%`],
        ['Tempo Médio de Conversão', `${Math.round(data.avgConversionDays)} dias`],
      ],
    });

    // By Product
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Conversão por Produto', 14, 22);
    autoTable(doc, {
      startY: 27,
      head: [['Produto', 'Total', 'Convertidas', 'Perdidas', 'Taxa']],
      body: data.byProduct.map(p => [
        p.name,
        p.total.toString(),
        p.converted.toString(),
        p.lost.toString(),
        `${p.conversionRate.toFixed(1)}%`,
      ]),
    });

    // By Assessor
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    doc.setFontSize(14);
    doc.text('Conversão por Assessor', 14, finalY + 15);
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Assessor', 'Total', 'Convertidas', 'Taxa', 'Tempo Médio']],
      body: data.byAssessor.map(a => [
        a.name,
        a.total.toString(),
        a.converted.toString(),
        `${a.conversionRate.toFixed(1)}%`,
        `${Math.round(a.avgDays)} dias`,
      ]),
    });

    doc.save(`relatorio-oportunidades-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Erro ao carregar dados do relatório</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Análise de Oportunidades</h1>
              <p className="text-sm text-muted-foreground">
                Conversão de cross-selling e reativação de clientes
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

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{data.totalOpportunities}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{data.convertedOpportunities}</div>
              <p className="text-xs text-muted-foreground">Convertidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{data.lostOpportunities}</div>
              <p className="text-xs text-muted-foreground">Perdidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-amber-600">{data.activeOpportunities}</div>
              <p className="text-xs text-muted-foreground">Em Andamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className={`text-2xl font-bold ${data.conversionRate >= 30 ? 'text-green-600' : data.conversionRate >= 15 ? 'text-amber-600' : 'text-red-600'}`}>
                {data.conversionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Taxa Conversão</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{Math.round(data.avgConversionDays)}</div>
              <p className="text-xs text-muted-foreground">Dias p/ Converter</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly Evolution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Evolução Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.byMonth}>
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="converted" name="Convertidas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lost" name="Perdidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="active" name="Em Andamento" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conversion Rate Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Conversão por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.byMonth.map(m => ({
                  ...m,
                  rate: m.total > 0 ? ((m.converted / m.total) * 100).toFixed(1) : 0,
                }))}>
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => [`${value}%`, 'Taxa']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* By Product */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Conversão por Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.byProduct.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhuma oportunidade com produto definido
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.byProduct.slice(0, 8)} layout="vertical">
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="converted" name="Convertidas" fill="#22c55e" stackId="a" />
                    <Bar dataKey="lost" name="Perdidas" fill="#ef4444" stackId="a" />
                    <Bar dataKey="active" name="Em Andamento" fill="#f59e0b" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* By Campaign */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Conversão por Campanha
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.byCampaign.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhuma oportunidade registrada
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.byCampaign.slice(0, 8)} layout="vertical">
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="converted" name="Convertidas" fill="#22c55e" stackId="a" />
                    <Bar dataKey="lost" name="Perdidas" fill="#ef4444" stackId="a" />
                    <Bar dataKey="active" name="Em Andamento" fill="#f59e0b" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 3 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Loss Reasons */}
          <Card>
            <CardHeader>
              <CardTitle>Motivos de Perda</CardTitle>
            </CardHeader>
            <CardContent>
              {data.lossReasons.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhuma oportunidade perdida
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.lossReasons}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ reason, percentage }) => `${reason}: ${percentage.toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="reason"
                    >
                      {data.lossReasons.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Products by Conversion */}
          <Card>
            <CardHeader>
              <CardTitle>Top Produtos (Taxa de Conversão)</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topProducts.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Mínimo 3 oportunidades por produto
                </div>
              ) : (
                <div className="space-y-4">
                  {data.topProducts.map((product, index) => (
                    <div key={product.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-muted-foreground">
                            #{index + 1}
                          </span>
                          <span className="font-medium">{product.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-green-600">
                            {product.conversionRate.toFixed(1)}%
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({product.converted}/{product.total})
                          </span>
                        </div>
                      </div>
                      <Progress value={product.conversionRate} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assessor Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Performance por Assessor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byAssessor.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Nenhuma oportunidade registrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Assessor</th>
                      <th className="text-center py-3 px-4 font-medium">Total</th>
                      <th className="text-center py-3 px-4 font-medium">Convertidas</th>
                      <th className="text-center py-3 px-4 font-medium">Perdidas</th>
                      <th className="text-center py-3 px-4 font-medium">Em Andamento</th>
                      <th className="text-center py-3 px-4 font-medium">Taxa</th>
                      <th className="text-center py-3 px-4 font-medium">Tempo Médio</th>
                      <th className="text-left py-3 px-4 font-medium w-32">Conversão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byAssessor.map((assessor) => (
                      <tr key={assessor.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{assessor.name}</td>
                        <td className="text-center py-3 px-4">{assessor.total}</td>
                        <td className="text-center py-3 px-4 text-green-600 font-medium">
                          {assessor.converted}
                        </td>
                        <td className="text-center py-3 px-4 text-red-600">
                          {assessor.lost}
                        </td>
                        <td className="text-center py-3 px-4 text-amber-600">
                          {assessor.active}
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`font-bold ${
                            assessor.conversionRate >= 30 
                              ? 'text-green-600' 
                              : assessor.conversionRate >= 15 
                                ? 'text-amber-600' 
                                : 'text-red-600'
                          }`}>
                            {assessor.conversionRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-4 text-muted-foreground">
                          {assessor.avgDays > 0 ? `${Math.round(assessor.avgDays)} dias` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Progress value={assessor.conversionRate} className="h-2" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
