import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useRevenues, useDeleteRevenue } from '@/hooks/useRevenues';
import { useClients } from '@/hooks/useClients';
import { useProducts, useSubproducts } from '@/hooks/useConfiguration';
import { Revenue } from '@/types/database';
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
import { RevenueFormDialog } from '@/components/revenues/RevenueFormDialog';
import { ImportRevenuesDialog } from '@/components/revenues/ImportRevenuesDialog';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  FileSpreadsheet,
  Search,
  DollarSign,
  TrendingUp,
  Calendar,
  Pencil,
  Trash2,
  Package,
  User,
  Filter,
  X,
} from 'lucide-react';

interface RevenueFilters {
  clientId?: string;
  productId?: string;
  subproductId?: string;
  startDate?: string;
  endDate?: string;
}

export default function RevenuesPage() {
  const [filters, setFilters] = useState<RevenueFilters>({
    startDate: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: revenues, isLoading } = useRevenues(filters);
  const { data: clients } = useClients({ active: true });
  const { data: products } = useProducts();
  const { data: subproducts } = useSubproducts(filters.productId);
  const deleteRevenue = useDeleteRevenue();

  // Filter by search term (client name)
  const filteredRevenues = revenues?.filter((revenue) => {
    if (!searchTerm) return true;
    const clientName = revenue.client?.name?.toLowerCase() || '';
    const productName = revenue.product?.name?.toLowerCase() || '';
    return clientName.includes(searchTerm.toLowerCase()) || 
           productName.includes(searchTerm.toLowerCase());
  });

  // Calculate totals
  const totals = filteredRevenues?.reduce(
    (acc, rev) => ({
      gross: acc.gross + Number(rev.gross_revenue),
      taxes: acc.taxes + Number(rev.taxes),
      bank: acc.bank + Number(rev.bank_share),
      our: acc.our + Number(rev.our_share),
    }),
    { gross: 0, taxes: 0, bank: 0, our: 0 }
  ) || { gross: 0, taxes: 0, bank: 0, our: 0 };

  const handleEdit = (revenue: Revenue) => {
    setEditingRevenue(revenue);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRevenue.mutateAsync(deleteId);
      toast.success('Receita excluída com sucesso');
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir receita');
    }
  };

  const clearFilters = () => {
    setFilters({
      startDate: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });
    setSearchTerm('');
  };

  const hasActiveFilters = filters.clientId || filters.productId || filters.subproductId || searchTerm;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <MainLayout title="Receitas">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receitas</h1>
          <p className="text-muted-foreground">
            Gerencie as receitas dos seus clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button onClick={() => {
            setEditingRevenue(undefined);
            setFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Receita
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.gross)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impostos</CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totals.taxes)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genial</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.bank)}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zeve</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totals.our)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-6">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou produto..."
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
              value={filters.productId || 'all'}
              onValueChange={(value) => 
                setFilters({ 
                  ...filters, 
                  productId: value === 'all' ? undefined : value,
                  subproductId: undefined 
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                {products?.filter(p => p.active).map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.clientId || 'all'}
              onValueChange={(value) => 
                setFilters({ ...filters, clientId: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger>
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
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Filter className="h-3 w-3" />
                Filtros ativos
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" />
                Limpar filtros
              </Button>
            </div>
          )}
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
          ) : !filteredRevenues?.length ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Nenhuma receita encontrada</h3>
              <p className="text-muted-foreground">
                Comece adicionando sua primeira receita ou ajuste os filtros.
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingRevenue(undefined);
                  setFormOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Receita
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Subproduto</TableHead>
                    <TableHead className="text-right">Bruto</TableHead>
                    <TableHead className="text-right">Impostos</TableHead>
                    <TableHead className="text-right">Banco</TableHead>
                    <TableHead className="text-right">Nossa Parte</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRevenues.map((revenue) => (
                    <TableRow key={revenue.id}>
                      <TableCell>
                        {format(new Date(revenue.date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{revenue.client?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{revenue.product?.name}</Badge>
                      </TableCell>
                      <TableCell>
                        {revenue.subproduct?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(Number(revenue.gross_revenue))}
                      </TableCell>
                      <TableCell className="text-right font-mono text-destructive">
                        {formatCurrency(Number(revenue.taxes))}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(Number(revenue.bank_share))}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-primary">
                        {formatCurrency(Number(revenue.our_share))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(revenue)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(revenue.id)}
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

          {filteredRevenues && filteredRevenues.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-right">
              {filteredRevenues.length} registro(s) encontrado(s)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <RevenueFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        revenue={editingRevenue}
      />

      {/* Import Dialog */}
      <ImportRevenuesDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.
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
    </MainLayout>
  );
}
