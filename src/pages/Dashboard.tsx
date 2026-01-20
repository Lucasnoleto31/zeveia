import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ContractsChart } from '@/components/dashboard/ContractsChart';
import { ClientsChart } from '@/components/dashboard/ClientsChart';
import { LeadsPipeline } from '@/components/dashboard/LeadsPipeline';
import { TasksWidget } from '@/components/dashboard/TasksWidget';
import { PeriodFilter } from '@/components/reports/PeriodFilter';
import { useDashboardMetrics, DashboardPeriodOptions } from '@/hooks/useDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  UserPlus, 
  DollarSign, 
  BarChart3,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { profile, isSocio } = useAuth();
  
  // Period filter states
  const [periodType, setPeriodType] = useState<'preset' | 'custom'>('preset');
  const [months, setMonths] = useState(12);
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  // Calculate period options
  const periodOptions = useMemo<DashboardPeriodOptions>(() => {
    if (periodType === 'custom' && customStartDate && customEndDate) {
      return {
        startDate: format(customStartDate, 'yyyy-MM-dd'),
        endDate: format(customEndDate, 'yyyy-MM-dd'),
      };
    }
    return { months };
  }, [periodType, months, customStartDate, customEndDate]);

  const { data: metrics, isLoading } = useDashboardMetrics(periodOptions);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <MainLayout>
      {/* Welcome Section with Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Olá, {profile?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            {isSocio 
              ? 'Visão geral do escritório' 
              : 'Seu resumo de performance'}
          </p>
        </div>
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
      </div>

      {/* Metrics Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <MetricCard
            title="Clientes Ativos"
            value={metrics?.totalClients || 0}
            description={`${metrics?.totalClientsPF || 0} PF | ${metrics?.totalClientsPJ || 0} PJ`}
            icon={Users}
          />
          <MetricCard
            title="Leads em Andamento"
            value={metrics?.totalLeads || 0}
            description="Aguardando conversão"
            icon={UserPlus}
          />
          <MetricCard
            title="Receita do Período"
            value={formatCurrency(metrics?.totalRevenue || 0)}
            description={`Mês atual: ${formatCurrency(metrics?.monthlyRevenue || 0)}`}
            icon={DollarSign}
          />
          <MetricCard
            title="Lotes Girados"
            value={(metrics?.totalLotsTraded || 0).toLocaleString('pt-BR')}
            description={`${metrics?.totalLotsZeroed || 0} zerados`}
            icon={BarChart3}
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <RevenueChart periodOptions={periodOptions} />
        <ContractsChart periodOptions={periodOptions} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ClientsChart periodOptions={periodOptions} />
        {metrics && <LeadsPipeline data={metrics.leadsByStatus} />}
        <TasksWidget />
      </div>
    </MainLayout>
  );
}
