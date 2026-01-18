import { useState } from 'react';
import { useContracts, useDeleteContract, useContractStats } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { useAssets, usePlatforms } from '@/hooks/useConfiguration';
import { Contract } from '@/types/database';
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
import { ContractFormDialog } from '@/components/contracts/ContractFormDialog';
import { ImportContractsDialog } from '@/components/contracts/ImportContractsDialog';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  Plus,
  FileSpreadsheet,
  Search,
  FileBarChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Pencil,
  Trash2,
  User,
  Filter,
  X,
  Target,
  Percent,
} from 'lucide-react';

interface ContractFilters {
  clientId?: string;
  assetId?: string;
  platformId?: string;
  startDate?: string;
  endDate?: string;
}

export default function ContractsPage() {
  const [filters, setFilters] = useState<ContractFilters>({
    startDate: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: contracts, isLoading } = useContracts(filters);
  const { data: stats } = useContractStats(filters);
  const { data: clients } = useClients({ active: true });
  const { data: assets } = useAssets();
  const { data: platforms } = usePlatforms();
  const deleteContract = useDeleteContract();

  // Filter by search term (client name)
  const filteredContracts = contracts?.filter((contract) => {
    if (!searchTerm) return true;
    const clientName = contract.client?.name?.toLowerCase() || '';
    const assetCode = contract.asset?.code?.toLowerCase() || '';
    return clientName.includes(searchTerm.toLowerCase()) || 
           assetCode.includes(searchTerm.toLowerCase());
  });

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteContract.mutateAsync(deleteId);
      toast.success('Contrato excluído com sucesso');
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir contrato');
    }
  };

  const clearFilters = () => {
    setFilters({
      startDate: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });
    setSearchTerm('');
  };

  const hasActiveFilters = filters.clientId || filters.assetId || filters.platformId || searchTerm;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contratos Day Trade</h1>
          <p className="text-muted-foreground">
            Gerencie os contratos operados pelos seus clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button onClick={() => {
            setEditingContract(undefined);
            setFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Contrato
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lotes Operados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalTraded?.toLocaleString('pt-BR') || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lotes Zerados</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.totalZeroed?.toLocaleString('pt-BR') || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Zeramento</CardTitle>
            <Percent className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats?.zeroRate?.toFixed(1) || 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredContracts?.length || 0}
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
                placeholder="Buscar por cliente ou ativo..."
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
              value={filters.assetId || 'all'}
              onValueChange={(value) => 
                setFilters({ ...filters, assetId: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Ativo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os ativos</SelectItem>
                {assets?.filter(a => a.active).map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.code} {asset.name && `- ${asset.name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
          ) : !filteredContracts?.length ? (
            <div className="text-center py-12">
              <FileBarChart className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum contrato encontrado</h3>
              <p className="text-muted-foreground">
                Comece registrando seu primeiro contrato ou ajuste os filtros.
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingContract(undefined);
                  setFormOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Contrato
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead className="text-right">Lotes Operados</TableHead>
                    <TableHead className="text-right">Lotes Zerados</TableHead>
                    <TableHead className="text-right">Taxa Zero</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => {
                    const zeroRate = contract.lots_traded > 0 
                      ? ((contract.lots_zeroed / contract.lots_traded) * 100).toFixed(1)
                      : '0.0';
                    return (
                      <TableRow key={contract.id}>
                        <TableCell>
                          {format(new Date(contract.date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{contract.client?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {contract.asset?.code}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {contract.platform?.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {contract.lots_traded.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-green-600">
                          {contract.lots_zeroed.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={Number(zeroRate) >= 50 ? 'default' : 'secondary'}
                            className={Number(zeroRate) >= 50 ? 'bg-green-600' : ''}
                          >
                            {zeroRate}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(contract)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(contract.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredContracts && filteredContracts.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-right">
              {filteredContracts.length} registro(s) encontrado(s)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <ContractFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        contract={editingContract}
      />

      {/* Import Dialog */}
      <ImportContractsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.
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
