import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ContractsChart } from '@/components/dashboard/ContractsChart';
import { ClientsChart } from '@/components/dashboard/ClientsChart';
import { LeadsPipeline } from '@/components/dashboard/LeadsPipeline';
import { useDashboardMetrics } from '@/hooks/useDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  UserPlus, 
  DollarSign, 
  TrendingUp,
  Building2,
  User,
  BarChart3,
  Target
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: metrics, isLoading } = useDashboardMetrics();
  const { profile, isSocio } = useAuth();

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
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Olá, {profile?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground">
          {isSocio 
            ? 'Visão geral do escritório' 
            : 'Seu resumo de performance'}
        </p>
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
            title="Receita do Mês"
            value={formatCurrency(metrics?.monthlyRevenue || 0)}
            description={`Total: ${formatCurrency(metrics?.totalRevenue || 0)}`}
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
        <RevenueChart />
        <ContractsChart />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ClientsChart />
        {metrics && <LeadsPipeline data={metrics.leadsByStatus} />}
      </div>
    </MainLayout>
  );
}
