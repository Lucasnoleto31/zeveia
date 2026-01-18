import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Cake, 
  UserX, 
  Phone, 
  TrendingUp, 
  RefreshCw,
  CheckCheck,
  Archive,
  Loader2
} from 'lucide-react';
import { 
  useAlerts, 
  useUnreadAlertsCount,
  useMarkAlertAsRead, 
  useMarkAllAlertsAsRead,
  useDismissAlert,
  useGenerateAlerts,
  AlertFilters as AlertFiltersType
} from '@/hooks/useAlerts';
import { AlertCard } from '@/components/alerts/AlertCard';
import { AlertFilters } from '@/components/alerts/AlertFilters';
import { AlertType } from '@/types/database';
import { toast } from 'sonner';

const alertTypeStats: { type: AlertType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'aniversario', label: 'Aniversários', icon: Cake, color: 'text-pink-600' },
  { type: 'inativo', label: 'Inativos', icon: UserX, color: 'text-orange-600' },
  { type: 'follow_up', label: 'Follow-ups', icon: Phone, color: 'text-blue-600' },
  { type: 'cross_selling', label: 'Cross-selling', icon: TrendingUp, color: 'text-green-600' },
];

export default function AlertsPage() {
  const [filters, setFilters] = useState<AlertFiltersType>({ dismissed: false });
  const [activeTab, setActiveTab] = useState('all');

  const { data: alerts = [], isLoading } = useAlerts(filters);
  const { data: unreadCount = 0 } = useUnreadAlertsCount();
  const { data: dismissedAlerts = [] } = useAlerts({ dismissed: true });

  const markAsRead = useMarkAlertAsRead();
  const markAllAsRead = useMarkAllAlertsAsRead();
  const dismissAlert = useDismissAlert();
  const generateAlerts = useGenerateAlerts();

  // Count by type
  const countByType = alertTypeStats.map(({ type }) => ({
    type,
    count: alerts.filter(a => a.type === type).length,
    unread: alerts.filter(a => a.type === type && !a.read).length,
  }));

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id, {
      onError: () => toast.error('Erro ao marcar alerta como lido'),
    });
  };

  const handleDismiss = (id: string) => {
    dismissAlert.mutate(id, {
      onSuccess: () => toast.success('Alerta dispensado'),
      onError: () => toast.error('Erro ao dispensar alerta'),
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => toast.success('Todos os alertas marcados como lidos'),
      onError: () => toast.error('Erro ao marcar alertas como lidos'),
    });
  };

  const handleGenerateAlerts = () => {
    generateAlerts.mutate(undefined, {
      onSuccess: (count) => toast.success(`${count} alerta(s) gerado(s) com base nas regras de negócio`),
      onError: () => toast.error('Erro ao gerar alertas'),
    });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'all') {
      setFilters({ dismissed: false });
    } else if (value === 'dismissed') {
      setFilters({ dismissed: true });
    } else {
      setFilters({ dismissed: false, type: value as AlertType });
    }
  };

  const filteredAlerts = activeTab === 'dismissed' ? dismissedAlerts : alerts;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Alertas</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 
                  ? `${unreadCount} alerta${unreadCount > 1 ? 's' : ''} não lido${unreadCount > 1 ? 's' : ''}`
                  : 'Nenhum alerta pendente'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleGenerateAlerts}
              disabled={generateAlerts.isPending}
            >
              {generateAlerts.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar Alertas
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todos como lidos
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {alertTypeStats.map(({ type, label, icon: Icon, color }) => {
            const stats = countByType.find(c => c.type === type);
            return (
              <Card 
                key={type} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleTabChange(type)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${color}`} />
                      <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="text-2xl font-bold">{stats?.count || 0}</p>
                      </div>
                    </div>
                    {(stats?.unread || 0) > 0 && (
                      <Badge variant="default" className="h-6">
                        {stats?.unread} novo{(stats?.unread || 0) > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs and Filters */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                Todos
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="aniversario">Aniversários</TabsTrigger>
              <TabsTrigger value="inativo">Inativos</TabsTrigger>
              <TabsTrigger value="follow_up">Follow-ups</TabsTrigger>
              <TabsTrigger value="cross_selling">Cross-selling</TabsTrigger>
              <TabsTrigger value="dismissed" className="gap-2">
                <Archive className="h-4 w-4" />
                Dispensados
              </TabsTrigger>
            </TabsList>
          </div>

          {activeTab !== 'dismissed' && (
            <div className="mt-4">
              <AlertFilters filters={filters} onFiltersChange={setFilters} />
            </div>
          )}

          {/* Alert List */}
          <div className="mt-6">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium">
                    {activeTab === 'dismissed' 
                      ? 'Nenhum alerta dispensado'
                      : 'Nenhum alerta encontrado'
                    }
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeTab === 'dismissed'
                      ? 'Alertas dispensados aparecerão aqui'
                      : 'Clique em "Atualizar Alertas" para gerar novos alertas com base nas regras de negócio'
                    }
                  </p>
                  {activeTab !== 'dismissed' && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={handleGenerateAlerts}
                      disabled={generateAlerts.isPending}
                    >
                      {generateAlerts.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Gerar Alertas
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onMarkAsRead={handleMarkAsRead}
                    onDismiss={handleDismiss}
                  />
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
