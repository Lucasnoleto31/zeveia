import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePartners, useDeletePartner } from '@/hooks/usePartners';
import { usePartnerROI } from '@/hooks/usePartnerROI';
import { Partner } from '@/types/database';
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
import { PartnerFormDialog } from '@/components/partners/PartnerFormDialog';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Handshake,
  Users,
  DollarSign,
  TrendingUp,
  Pencil,
  Trash2,
  Eye,
  Filter,
  X,
  Megaphone,
  UserCheck,
} from 'lucide-react';

interface PartnerFilters {
  search?: string;
  type?: 'parceiro' | 'influenciador';
  active?: boolean;
}

export default function PartnersPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<PartnerFilters>({ active: true });
  const [formOpen, setFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: partners, isLoading } = usePartners(filters);
  const { data: roiData } = usePartnerROI();
  const deletePartner = useDeletePartner();

  // Merge ROI data with partners
  const partnersWithROI = partners?.map(partner => ({
    ...partner,
    roi: roiData?.find(r => r.partnerId === partner.id),
  }));

  // Calculate totals
  const totals = {
    partners: partners?.filter(p => p.type === 'parceiro').length || 0,
    influencers: partners?.filter(p => p.type === 'influenciador').length || 0,
    totalClients: roiData?.reduce((sum, r) => sum + r.clientCount, 0) || 0,
    totalRevenue: roiData?.reduce((sum, r) => sum + r.totalRevenue, 0) || 0,
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormOpen(true);
  };

  const handleView = (partnerId: string) => {
    navigate(`/partners/${partnerId}`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePartner.mutateAsync(deleteId);
      toast.success('Parceiro excluído com sucesso');
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir parceiro');
    }
  };

  const clearFilters = () => {
    setFilters({ active: true });
  };

  const hasActiveFilters = filters.search || filters.type;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <MainLayout title="Parceiros">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parceiros</h1>
          <p className="text-muted-foreground">
            Gerencie seus parceiros e influenciadores
          </p>
        </div>
        <Button onClick={() => {
          setEditingPartner(undefined);
          setFormOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Parceiro
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parceiros</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.partners}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Influenciadores</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.influencers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Indicados</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totals.totalClients}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Gerada</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totals.totalRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>

            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => 
                setFilters({ ...filters, type: value === 'all' ? undefined : value as 'parceiro' | 'influenciador' })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="parceiro">Parceiros</SelectItem>
                <SelectItem value="influenciador">Influenciadores</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.active === undefined ? 'all' : filters.active ? 'active' : 'inactive'}
              onValueChange={(value) => 
                setFilters({ 
                  ...filters, 
                  active: value === 'all' ? undefined : value === 'active' 
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
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
          ) : !partnersWithROI?.length ? (
            <div className="text-center py-12">
              <Handshake className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum parceiro encontrado</h3>
              <p className="text-muted-foreground">
                Comece cadastrando seu primeiro parceiro ou ajuste os filtros.
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingPartner(undefined);
                  setFormOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Parceiro
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-center">Clientes</TableHead>
                    <TableHead className="text-right">Receita Gerada</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-[120px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partnersWithROI.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {partner.type === 'parceiro' ? (
                            <Handshake className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Megaphone className="h-4 w-4 text-purple-600" />
                          )}
                          <span className="font-medium">{partner.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={partner.type === 'parceiro' ? 'border-blue-600 text-blue-600' : 'border-purple-600 text-purple-600'}
                        >
                          {partner.type === 'parceiro' ? 'Parceiro' : 'Influenciador'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {partner.email && <div>{partner.email}</div>}
                          {partner.phone && <div className="text-muted-foreground">{partner.phone}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="gap-1">
                          <UserCheck className="h-3 w-3" />
                          {partner.roi?.clientCount || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(partner.roi?.totalRevenue || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {partner.commission_percentage}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={partner.active ? 'default' : 'secondary'}>
                          {partner.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(partner.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(partner)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(partner.id)}
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

          {partnersWithROI && partnersWithROI.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-right">
              {partnersWithROI.length} registro(s) encontrado(s)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <PartnerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        partner={editingPartner}
      />


      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este parceiro? Esta ação não pode ser desfeita.
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
