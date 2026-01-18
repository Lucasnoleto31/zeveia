import { useState } from 'react';
import { usePlatformCosts, useDeletePlatformCost, usePlatformCostStats } from '@/hooks/usePlatformCosts';
import { useClients } from '@/hooks/useClients';
import { usePlatforms } from '@/hooks/useConfiguration';
import { PlatformCost } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PlatformCostFormDialog } from '@/components/platform-costs/PlatformCostFormDialog';
import { ImportPlatformCostsDialog } from '@/components/platform-costs/ImportPlatformCostsDialog';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  Plus,
  FileSpreadsheet,
  Search,
  Monitor,
  TrendingDown,
  Calendar,
  Pencil,
  Trash2,
  User,
  Filter,
  X,
  DollarSign,
  BarChart3,
} from 'lucide-react';

interface PlatformCostFilters {
  clientId?: string;
  platformId?: string;
  startDate?: string;
  endDate?: string;
}

export default function PlatformCostsPage() {
  const [filters, setFilters] = useState<PlatformCostFilters>({
    startDate: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<PlatformCost | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: costs, isLoading } = usePlatformCosts(filters);
  const { data: stats } = usePlatformCostStats(filters);
  const { data: clients } = useClients({ active: true });
  const { data: platforms } = usePlatforms();
  const deleteCost = useDeletePlatformCost();

  // Filter by search term
  const filteredCosts = costs?.filter((cost) => {
    if (!searchTerm) return true;
    const clientName = cost.client?.name?.toLowerCase() || '';
    const platformName = cost.platform?.name?.toLowerCase() || '';
    return clientName.includes(searchTerm.toLowerCase()) || 
           platformName.includes(searchTerm.toLowerCase());
  });

  // Calculate monthly average
  const monthlyAvg = stats?.byMonth.length 
    ? stats.total / stats.byMonth.length 
    : 0;

  // Current month total
  const currentMonth = format(new Date(), 'yyyy-MM');
  const currentMonthTotal = stats?.byMonth.find(m => m.month === currentMonth)?.value || 0;

  const handleEdit = (cost: PlatformCost) => {
    setEditingCost(cost);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCost.mutateAsync(deleteId);
      toast.success('Custo excluído com sucesso');
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir custo');
    }
  };

  const clearFilters = () => {
    setFilters({
      startDate: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });
    setSearchTerm('');
  };

  const hasActiveFilters = filters.clientId || filters.platformId || searchTerm;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custos de Plataforma</h1>
          <p className="text-muted-foreground">
            Acompanhe os custos mensais de plataformas por cliente
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button onClick={() => {
            setEditingCost(undefined);
            setFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Custo
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total do Período</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.total || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mês Atual</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonthTotal)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Mensal</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(monthlyAvg)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plataformas</CardTitle>
            <Monitor className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats?.byPlatform.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform breakdown */}
      {stats?.byPlatform && stats.byPlatform.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Custos por Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.byPlatform
                .sort((a, b) => b.value - a.value)
                .map((platform) => (
                  <Badge 
                    key={platform.name} 
                    variant="secondary" 
                    className="text-sm py-1 px-3"
                  >
                    {platform.name}: {formatCurrency(platform.value)}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou plataforma..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">até</span>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            <Select
              value={filters.platformId || 'all'}
              onValueChange={(value) => 
                setFilters({ ...filters, platformId: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as plataformas</SelectItem>
                {platforms?.filter(p => p.active).map((platform) => (
                  <SelectItem key={platform.id} value={platform.id}>
                    {platform.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Select
              value={filters.clientId || 'all'}
              onValueChange={(value) => 
                setFilters({ ...filters, clientId: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <>
                <Badge variant="secondary" className="gap-1">
                  <Filter className="h-3 w-3" />
                  Filtros ativos
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-3 w-3 mr-1" />
                  Limpar filtros
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !filteredCosts?.length ? (
            <div className="text-center py-12">
              <Monitor className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum custo encontrado</h3>
              <p className="text-muted-foreground">
                Comece registrando o primeiro custo ou ajuste os filtros.
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingCost(undefined);
                  setFormOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Custo
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCosts.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell>
                        {format(new Date(cost.date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{cost.client?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <Monitor className="h-3 w-3" />
                          {cost.platform?.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-destructive">
                        {formatCurrency(Number(cost.value))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(cost)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(cost.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredCosts && filteredCosts.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-right">
              {filteredCosts.length} registro(s) encontrado(s)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <PlatformCostFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        cost={editingCost}
      />

      {/* Import Dialog */}
      <ImportPlatformCostsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este custo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
