import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Filter, Download, Loader2, TrendingUp } from 'lucide-react';
import { useFunnelReport } from '@/hooks/useFunnelReport';
import { FunnelChart } from '@/components/reports/FunnelChart';
import { ConversionRateCard } from '@/components/reports/ConversionRateCard';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4', '#ec4899'];

export default function FunnelReportPage() {
  const [months, setMonths] = useState(6);
  const { data, isLoading } = useFunnelReport(months);

  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.text('Relatório de Funil de Vendas', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Período: Últimos ${months} meses`, pageWidth / 2, 30, { align: 'center' });

    // Metrics
    doc.setFontSize(14);
    doc.text('Métricas Gerais', 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Leads', data.totalLeads.toString()],
        ['Leads Convertidos', data.convertedLeads.toString()],
        ['Leads Perdidos', data.lostLeads.toString()],
        ['Taxa de Conversão', `${data.conversionRate.toFixed(1)}%`],
        ['Tempo Médio de Conversão', `${data.avgConversionDays.toFixed(0)} dias`],
      ],
    });

    // Funnel stages
    const stagesY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Etapas do Funil', 14, stagesY);

    autoTable(doc, {
      startY: stagesY + 5,
      head: [['Etapa', 'Quantidade', 'Percentual']],
      body: data.stages.map((s) => [s.label, s.count.toString(), `${s.percentage.toFixed(1)}%`]),
    });

    // Conversion by assessor
    const assessorY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Conversão por Assessor', 14, assessorY);

    autoTable(doc, {
      startY: assessorY + 5,
      head: [['Assessor', 'Leads', 'Convertidos', 'Taxa']],
      body: data.leadsByAssessor.map((a) => [
        a.assessor,
        a.count.toString(),
        a.converted.toString(),
        `${a.rate.toFixed(1)}%`,
      ]),
    });

    doc.save('relatorio-funil-vendas.pdf');
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
          <p className="text-muted-foreground">Erro ao carregar dados do funil</p>
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
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Funil de Vendas</h1>
              <p className="text-sm text-muted-foreground">
                Análise de conversão e pipeline de leads
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

        {/* Conversion Metrics */}
        <ConversionRateCard
          totalLeads={data.totalLeads}
          convertedLeads={data.convertedLeads}
          lostLeads={data.lostLeads}
          conversionRate={data.conversionRate}
          avgConversionDays={data.avgConversionDays}
        />

        {/* Main Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Funnel Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <FunnelChart stages={data.stages} />
            </CardContent>
          </Card>

          {/* Leads by Month */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.leadsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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
                  <Bar dataKey="novo" name="Novos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="convertido" name="Convertidos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="perdido" name="Perdidos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* By Origin */}
          <Card>
            <CardHeader>
              <CardTitle>Leads por Origem</CardTitle>
            </CardHeader>
            <CardContent>
              {data.leadsByOrigin.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.leadsByOrigin}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="count"
                      nameKey="origin"
                      label={({ origin, percent }) =>
                        `${origin}: ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {data.leadsByOrigin.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  Sem dados de origem
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Campaign */}
          <Card>
            <CardHeader>
              <CardTitle>Leads por Campanha</CardTitle>
            </CardHeader>
            <CardContent>
              {data.leadsByCampaign.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.leadsByCampaign} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="campaign" type="category" width={100} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" name="Leads" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  Sem dados de campanha
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loss Reasons */}
          <Card>
            <CardHeader>
              <CardTitle>Motivos de Perda</CardTitle>
            </CardHeader>
            <CardContent>
              {data.lossReasons.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.lossReasons}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="count"
                      nameKey="reason"
                      label={({ reason, percent }) =>
                        `${reason}: ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {data.lossReasons.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  Nenhuma perda registrada
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assessor Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Assessor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Assessor</th>
                    <th className="text-center py-3 px-4 font-medium">Total Leads</th>
                    <th className="text-center py-3 px-4 font-medium">Convertidos</th>
                    <th className="text-center py-3 px-4 font-medium">Taxa de Conversão</th>
                    <th className="text-left py-3 px-4 font-medium">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leadsByAssessor.map((assessor) => (
                    <tr key={assessor.assessor} className="border-b last:border-0">
                      <td className="py-3 px-4 font-medium">{assessor.assessor}</td>
                      <td className="text-center py-3 px-4">{assessor.count}</td>
                      <td className="text-center py-3 px-4 text-green-600 font-medium">
                        {assessor.converted}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span
                          className={
                            assessor.rate >= 30
                              ? 'text-green-600'
                              : assessor.rate >= 15
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }
                        >
                          {assessor.rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              assessor.rate >= 30
                                ? 'bg-green-500'
                                : assessor.rate >= 15
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(assessor.rate * 2, 100)}%` }}
                          />
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
