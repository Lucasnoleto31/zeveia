import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
} from 'recharts';
import { 
  Download, 
  Loader2, 
  TrendingUp, 
  Users, 
  Trophy, 
  Clock, 
  CalendarDays, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  Megaphone
} from 'lucide-react';
import { useFunnelReport, CampaignDetails } from '@/hooks/useFunnelReport';
import { PeriodFilter, getPeriodLabel } from '@/components/reports/PeriodFilter';
import { LeadsCalendarView } from '@/components/reports/LeadsCalendarView';
import { DayLeadsDetailDialog } from '@/components/reports/DayLeadsDetailDialog';
import { CampaignDetailCard } from '@/components/reports/CampaignDetailCard';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Function to get heatmap color based on retention percentage
const getRetentionColor = (rate: number): string => {
  if (rate >= 80) return 'bg-green-600 text-white';
  if (rate >= 60) return 'bg-green-500 text-white';
  if (rate >= 40) return 'bg-amber-500 text-white';
  if (rate >= 20) return 'bg-orange-500 text-white';
  return 'bg-destructive text-white';
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
    doc.text('Relatório de Leads', pageWidth / 2, 20, { align: 'center' });

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
        ['Em Andamento', data.inProgressLeads.toString()],
        ['Taxa de Conversão', `${data.conversionRate.toFixed(1)}%`],
        ['Tempo Médio de Conversão', `${data.avgConversionDays.toFixed(0)} dias`],
      ],
    });

    // Campaign details
    const campaignY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Performance por Campanha', 14, campaignY);

    autoTable(doc, {
      startY: campaignY + 5,
      head: [['Campanha', 'Captados', 'Convertidos', 'Perdidos', 'Andamento', 'Taxa']],
      body: data.campaignDetails.slice(0, 15).map((c) => [
        c.campaign,
        c.total.toString(),
        c.converted.toString(),
        c.lost.toString(),
        c.inProgress.toString(),
        `${c.conversionRate.toFixed(1)}%`,
      ]),
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
      doc.text('Análise de Cohort - Retenção por Receita', 14, 20);

      const cohortHeaders = ['Cohort', 'Convertidos', 'Rastreados', 'Mês 0', 'Mês 1', 'Mês 2', 'Mês 3', 'Conv. Final'];
      const cohortBody = data.cohortData.map((c) => [
        c.cohort,
        c.convertedLeads.toString(),
        c.trackedLeads.toString(),
        c.trackedLeads > 0 && c.retention[0] && !c.retention[0].isFuture ? `${(c.retention[0].retentionRate ?? 0).toFixed(0)}%` : '--',
        c.trackedLeads > 0 && c.retention[1] && !c.retention[1].isFuture ? `${(c.retention[1].retentionRate ?? 0).toFixed(0)}%` : '--',
        c.trackedLeads > 0 && c.retention[2] && !c.retention[2].isFuture ? `${(c.retention[2].retentionRate ?? 0).toFixed(0)}%` : '--',
        c.trackedLeads > 0 && c.retention[3] && !c.retention[3].isFuture ? `${(c.retention[3].retentionRate ?? 0).toFixed(0)}%` : '--',
        `${(c.finalConversionRate ?? 0).toFixed(1)}%`,
      ]);

      autoTable(doc, {
        startY: 25,
        head: [cohortHeaders],
        body: cohortBody,
      });
    }

    doc.save('relatorio-leads.pdf');
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
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Relatório de Leads</h1>
              <p className="text-sm text-muted-foreground">
                Análise completa de conversão por campanha
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

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Captados</p>
                  <p className="text-2xl font-bold">{data.totalLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Convertidos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {data.convertedLeads}
                    <span className="text-sm font-normal ml-1">
                      ({data.totalLeads > 0 ? ((data.convertedLeads / data.totalLeads) * 100).toFixed(1) : 0}%)
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Perdidos</p>
                  <p className="text-2xl font-bold text-destructive">
                    {data.lostLeads}
                    <span className="text-sm font-normal ml-1">
                      ({data.totalLeads > 0 ? ((data.lostLeads / data.totalLeads) * 100).toFixed(1) : 0}%)
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {data.inProgressLeads}
                    <span className="text-sm font-normal ml-1">
                      ({data.totalLeads > 0 ? ((data.inProgressLeads / data.totalLeads) * 100).toFixed(1) : 0}%)
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Cards Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Performance por Campanha</h2>
            <Badge variant="secondary" className="ml-2">
              {data.campaignDetails.length} campanhas
            </Badge>
          </div>

          {data.campaignDetails.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.campaignDetails.map((campaign) => (
                <CampaignDetailCard key={campaign.campaign} campaign={campaign} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma campanha encontrada no período selecionado
              </CardContent>
            </Card>
          )}
        </div>

        {/* Collapsible Sections */}
        <Accordion type="multiple" className="space-y-4">
          {/* Monthly Evolution */}
          <AccordionItem value="evolution" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Evolução Mensal</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-4">
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
                    <Bar dataKey="novo" name="Novos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="convertido" name="Convertidos" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="perdido" name="Perdidos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Daily Calendar */}
          <AccordionItem value="calendar" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>Calendário de Performance Diária</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-4">
                <LeadsCalendarView 
                  dailyMetrics={data.leadsByDay} 
                  onSelectDate={handleSelectDate}
                  selectedDate={selectedDate || undefined}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Assessor Performance */}
          <AccordionItem value="assessors" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Performance por Assessor</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-4 overflow-x-auto">
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
                                ? 'text-amber-600'
                                : 'text-destructive'
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
                                  ? 'bg-amber-500'
                                  : 'bg-destructive'
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
            </AccordionContent>
          </AccordionItem>

          {/* Cohort Analysis */}
          {data.cohortData.length > 0 && (
            <AccordionItem value="cohort" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  <span>Análise de Cohort</span>
                  {data.bestCohort && (
                    <Badge variant="secondary" className="ml-2">
                      Melhor: {data.bestCohort.cohort} ({data.bestCohort.rate.toFixed(0)}%)
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4 space-y-4">
                  {/* Cohort Metrics */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Trophy className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Melhor Cohort</p>
                        <p className="font-bold">
                          {data.bestCohort?.cohort || '-'}
                          {data.bestCohort && (
                            <span className="text-sm font-normal text-green-600 ml-2">
                              {data.bestCohort.rate.toFixed(1)}%
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Retenção Média (3 meses)</p>
                        <p className="font-bold">{data.avgRetentionAt3Months.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Tempo Médio Conversão</p>
                        <p className="font-bold">{data.avgConversionDays.toFixed(0)} dias</p>
                      </div>
                    </div>
                  </div>

                  {/* Cohort Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Cohort</th>
                          <th className="text-center py-3 px-4 font-medium">Convertidos</th>
                          <th className="text-center py-3 px-4 font-medium">Rastreados</th>
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
                            <td className="text-center py-3 px-4">{cohort.convertedLeads}</td>
                            <td className="text-center py-3 px-4">
                              <span className={`${cohort.trackedLeads > 0 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                {cohort.trackedLeads}
                              </span>
                            </td>
                            {[0, 1, 2, 3, 4, 5].map((monthIndex) => {
                              const retention = cohort.retention[monthIndex];
                              if (!retention || retention.isFuture || retention.retentionRate === undefined || cohort.trackedLeads === 0) {
                                return (
                                  <td key={monthIndex} className="text-center py-3 px-2">
                                    <span className="text-muted-foreground">--</span>
                                  </td>
                                );
                              }
                              return (
                                <td key={monthIndex} className="text-center py-2 px-1">
                                  <span
                                    className={`inline-block px-2 py-1 rounded text-xs font-medium min-w-[48px] ${getRetentionColor(retention.retentionRate)}`}
                                  >
                                    {(retention.retentionRate ?? 0).toFixed(0)}%
                                  </span>
                                </td>
                              );
                            })}
                            <td className="text-center py-3 px-4">
                              <span className={`font-medium ${(cohort.finalConversionRate ?? 0) >= 20 ? 'text-green-600' : (cohort.finalConversionRate ?? 0) >= 10 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                {(cohort.finalConversionRate ?? 0).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Convertidos = leads com status "convertido" • Rastreados = leads com cliente vinculado • Retenção = % dos rastreados que geraram receita
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* Day Leads Detail Dialog */}
        <DayLeadsDetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          date={selectedDate}
          leads={selectedDateLeads}
        />
      </div>
    </MainLayout>
  );
}
