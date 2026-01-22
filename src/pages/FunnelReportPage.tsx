import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Download, Loader2, TrendingUp, Users, Trophy, Clock, CalendarDays } from 'lucide-react';
import { useFunnelReport, LeadWithDetails } from '@/hooks/useFunnelReport';
import { FunnelChart } from '@/components/reports/FunnelChart';
import { ConversionRateCard } from '@/components/reports/ConversionRateCard';
import { PeriodFilter, getPeriodLabel } from '@/components/reports/PeriodFilter';
import { LeadsCalendarView } from '@/components/reports/LeadsCalendarView';
import { DayLeadsDetailDialog } from '@/components/reports/DayLeadsDetailDialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4', '#ec4899'];

// Function to get heatmap color based on retention percentage
const getRetentionColor = (rate: number): string => {
  if (rate >= 80) return 'bg-green-600 text-white';
  if (rate >= 60) return 'bg-green-500 text-white';
  if (rate >= 40) return 'bg-yellow-500 text-white';
  if (rate >= 20) return 'bg-orange-500 text-white';
  return 'bg-red-500 text-white';
};

export default function FunnelReportPage() {
  const [periodType, setPeriodType] = useState<'preset' | 'custom'>('preset');
  const [months, setMonths] = useState(6);
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  const { data, isLoading } = useFunnelReport(
    periodType === 'custom' && customStartDate && customEndDate
      ? { startDate: format(customStartDate, 'yyyy-MM-dd'), endDate: format(customEndDate, 'yyyy-MM-dd') }
      : { months }
  );

  const periodLabel = getPeriodLabel(periodType, months, customStartDate, customEndDate);

  // Get leads for selected date
  const selectedDateLeads = useMemo(() => {
    if (!selectedDate || !data?.allLeadsWithDetails) {
      return { created: [], converted: [], lost: [] };
    }

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const allLeads = data.allLeadsWithDetails;

    const created = allLeads.filter((lead) => {
      const leadDate = format(parseISO(lead.created_at), 'yyyy-MM-dd');
      return leadDate === dateKey;
    });

    const converted = allLeads.filter((lead) => {
      if (lead.status !== 'convertido' || !lead.converted_at) return false;
      const convDate = format(parseISO(lead.converted_at), 'yyyy-MM-dd');
      return convDate === dateKey;
    });

    const lost = allLeads.filter((lead) => {
      if (lead.status !== 'perdido' || !lead.updated_at) return false;
      const lostDate = format(parseISO(lead.updated_at), 'yyyy-MM-dd');
      return lostDate === dateKey;
    });

    return { created, converted, lost };
  }, [selectedDate, data?.allLeadsWithDetails]);

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setIsDetailDialogOpen(true);
  };

  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.text('Relatório de Funil de Vendas', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Período: ${periodLabel}`, pageWidth / 2, 30, { align: 'center' });

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

    // Cohort Analysis
    if (data.cohortData.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Análise de Cohort', 14, 20);

      const cohortHeaders = ['Cohort', 'Total', 'Mês 0', 'Mês 1', 'Mês 2', 'Mês 3', 'Conv. Final'];
      const cohortBody = data.cohortData.map((c) => [
        c.cohort,
        c.totalLeads.toString(),
        c.retention[0] ? `${c.retention[0].activeRate.toFixed(0)}%` : '-',
        c.retention[1] ? `${c.retention[1].activeRate.toFixed(0)}%` : '-',
        c.retention[2] ? `${c.retention[2].activeRate.toFixed(0)}%` : '-',
        c.retention[3] ? `${c.retention[3].activeRate.toFixed(0)}%` : '-',
        `${c.finalConversionRate.toFixed(1)}%`,
      ]);

      autoTable(doc, {
        startY: 25,
        head: [cohortHeaders],
        body: cohortBody,
      });
    }

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

        {/* Daily Performance Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Performance Diária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsCalendarView 
              dailyMetrics={data.leadsByDay} 
              onSelectDate={handleSelectDate}
              selectedDate={selectedDate || undefined}
            />
          </CardContent>
        </Card>

        {/* Day Leads Detail Dialog */}
        <DayLeadsDetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          date={selectedDate}
          leads={selectedDateLeads}
        />

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

          {/* Campaign Success */}
          <Card>
            <CardHeader>
              <CardTitle>Sucesso por Campanha</CardTitle>
            </CardHeader>
            <CardContent>
              {data.leadsByCampaign.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.leadsByCampaign} layout="vertical">
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="campaign" type="category" width={100} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string, props: any) => {
                        if (name === 'Taxa') return [`${value.toFixed(1)}%`, name];
                        return [value, name];
                      }}
                      labelFormatter={(label) => {
                        const item = data.leadsByCampaign.find((c) => c.campaign === label);
                        return item ? `${label} (Taxa: ${item.rate.toFixed(1)}%)` : String(label);
                      }}
                    />
                    <Legend />
                    <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="converted" name="Convertidos" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="lost" name="Perdidos" fill="#ef4444" radius={[0, 4, 4, 0]} />
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

        {/* Cohort Analysis Section */}
        {data.cohortData.length > 0 && (
          <>
            {/* Cohort Metrics Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Melhor Cohort</p>
                      <p className="text-xl font-bold">
                        {data.bestCohort?.cohort || '-'}
                        {data.bestCohort && (
                          <span className="text-sm font-normal text-green-600 ml-2">
                            {data.bestCohort.rate.toFixed(1)}%
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Retenção Média (3 meses)</p>
                      <p className="text-xl font-bold">
                        {data.avgRetentionAt3Months.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                      <Clock className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tempo Médio Conversão</p>
                      <p className="text-xl font-bold">
                        {data.avgConversionDays.toFixed(0)} dias
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cohort Retention Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Análise de Cohort - Retenção
                  <Badge variant="secondary" className="font-normal">
                    % de leads ativos + convertidos por mês
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Cohort</th>
                        <th className="text-center py-3 px-4 font-medium">Total</th>
                        <th className="text-center py-3 px-2 font-medium">Mês 0</th>
                        <th className="text-center py-3 px-2 font-medium">Mês 1</th>
                        <th className="text-center py-3 px-2 font-medium">Mês 2</th>
                        <th className="text-center py-3 px-2 font-medium">Mês 3</th>
                        <th className="text-center py-3 px-2 font-medium">Mês 4</th>
                        <th className="text-center py-3 px-2 font-medium">Mês 5</th>
                        <th className="text-center py-3 px-4 font-medium">Conv. Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.cohortData.map((cohort) => (
                        <tr key={cohort.cohort} className="border-b last:border-0">
                          <td className="py-3 px-4 font-medium">{cohort.cohort}</td>
                          <td className="text-center py-3 px-4">{cohort.totalLeads}</td>
                          {[0, 1, 2, 3, 4, 5].map((monthIndex) => {
                            const retention = cohort.retention[monthIndex];
                            if (!retention) {
                              return (
                                <td key={monthIndex} className="text-center py-3 px-2">
                                  <span className="text-muted-foreground">-</span>
                                </td>
                              );
                            }
                            return (
                              <td key={monthIndex} className="text-center py-2 px-1">
                                <span
                                  className={`inline-block px-2 py-1 rounded text-xs font-medium min-w-[48px] ${getRetentionColor(retention.activeRate)}`}
                                >
                                  {retention.activeRate.toFixed(0)}%
                                </span>
                              </td>
                            );
                          })}
                          <td className="text-center py-3 px-4">
                            <span className={`font-medium ${cohort.finalConversionRate >= 20 ? 'text-green-600' : cohort.finalConversionRate >= 10 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                              {cohort.finalConversionRate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Cohort Conversion Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Conversão por Cohort</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={data.cohortData.map((c) => {
                      const lastRetention = c.retention && c.retention.length > 0 
                        ? c.retention[c.retention.length - 1] 
                        : null;
                      return {
                        cohort: c.cohort,
                        convertidos: lastRetention?.converted || 0,
                        ativos: lastRetention?.active || 0,
                        perdidos: lastRetention?.lost || 0,
                      };
                    })}
                  >
                    <XAxis dataKey="cohort" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="convertidos" name="Convertidos" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="ativos" name="Em Andamento" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="perdidos" name="Perdidos" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
