import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ClientFilters } from '@/components/clients/ClientFilters';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { ClientFormDialog } from '@/components/clients/ClientFormDialog';
import { ImportClientsDialog } from '@/components/clients/ImportClientsDialog';
import { MergeClientsDialog } from '@/components/clients/MergeClientsDialog';
import { DataTablePagination } from '@/components/shared/DataTablePagination';
import { useClientsPaginated, useClients, useUpdateClient, useDeactivateInactiveClients, useFetchInactiveClientsCount } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';
import { useFindDuplicates } from '@/hooks/useMergeClients';
import { Client, ClientType, InvestorProfile } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Upload, Users, Building2, Loader2, GitMerge, UserX } from 'lucide-react';
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
import { toast } from '@/hooks/use-toast';

interface ClientFiltersState {
  search: string;
  type?: ClientType;
  profile?: InvestorProfile;
  state?: string;
  partnerId?: string;
  assessorId?: string;
  active?: boolean;
}

export default function ClientsPage() {
  const navigate = useNavigate();
  const { user, isSocio } = useAuth();
  const [filters, setFilters] = useState<ClientFiltersState>({ search: '', active: true });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formType, setFormType] = useState<ClientType>('pf');
  const [deactivatingClient, setDeactivatingClient] = useState<Client | null>(null);
  const [bulkDeactivateOpen, setBulkDeactivateOpen] = useState(false);
  const [bulkCount, setBulkCount] = useState(0);

  const updateClient = useUpdateClient();
  const deactivateInactive = useDeactivateInactiveClients();
  const fetchInactiveCount = useFetchInactiveClientsCount();

  const { data: paginatedData, isLoading } = useClientsPaginated({
    search: filters.search || undefined,
    type: filters.type,
    profile: filters.profile,
    state: filters.state,
    partnerId: filters.partnerId,
    assessorId: isSocio ? filters.assessorId : user?.id,
    active: filters.active,
    page,
    pageSize,
  });

  // For merge functionality, we need all clients
  const { data: allClients } = useClients({
    assessorId: isSocio ? filters.assessorId : user?.id,
    active: filters.active,
  });

  const clients = paginatedData?.data || [];
  const totalCount = paginatedData?.totalCount || 0;
  const totalPages = paginatedData?.totalPages || 0;

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormType(client.type);
    setIsFormOpen(true);
  };

  const handleView = (client: Client) => {
    navigate(`/clients/${client.id}`);
  };

  const handleNewClient = (type: ClientType) => {
    setFormType(type);
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingClient(null);
  };

  const handleDeactivateClient = (client: Client) => {
    setDeactivatingClient(client);
  };

  const confirmDeactivateClient = () => {
    if (!deactivatingClient) return;
    updateClient.mutate(
      { id: deactivatingClient.id, active: false },
      {
        onSuccess: () => {
          toast({ title: `${deactivatingClient.type === 'pf' ? deactivatingClient.name : deactivatingClient.company_name} foi inativado.` });
          setDeactivatingClient(null);
        },
        onError: () => {
          toast({ title: 'Erro ao inativar cliente', variant: 'destructive' });
        },
      }
    );
  };

  const handleBulkDeactivate = async () => {
    const result = await fetchInactiveCount.mutateAsync();
    setBulkCount(result.count);
    setBulkDeactivateOpen(true);
  };

  const confirmBulkDeactivate = () => {
    deactivateInactive.mutate(undefined, {
      onSuccess: (result) => {
        toast({ title: `${result?.count || 0} clientes inativados com sucesso.` });
        setBulkDeactivateOpen(false);
      },
      onError: () => {
        toast({ title: 'Erro ao inativar clientes', variant: 'destructive' });
      },
    });
  };

  const pfCount = clients?.filter(c => c.type === 'pf').length || 0;
  const pjCount = clients?.filter(c => c.type === 'pj').length || 0;
  
  const duplicateGroups = useFindDuplicates(allClients);
  const duplicateCount = duplicateGroups.length;

  return (
    <MainLayout title="Clientes">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <ClientFilters
            filters={filters}
            onFiltersChange={(newFilters) => {
              setFilters(newFilters);
              setPage(1); // Reset to first page on filter change
            }}
            showAssessorFilter={isSocio}
          />
          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            <Button
              variant="outline"
              onClick={handleBulkDeactivate}
              disabled={fetchInactiveCount.isPending}
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              <UserX className="h-4 w-4 mr-2" />
              {fetchInactiveCount.isPending ? 'Verificando...' : 'Inativar Sem Receita'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsMergeOpen(true)}
              className={duplicateCount > 0 ? 'border-amber-500 text-amber-600 hover:bg-amber-50' : ''}
            >
              <GitMerge className="h-4 w-4 mr-2" />
              Mesclar
              {duplicateCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800">
                  {duplicateCount}
                </Badge>
              )}
            </Button>
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar Excel
            </Button>
            <Button onClick={() => handleNewClient('pf')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Tabs for PF/PJ */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              Todos
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {totalCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="pf" className="gap-2">
              <Users className="h-4 w-4" />
              Pessoa Física
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{pfCount}</span>
            </TabsTrigger>
            <TabsTrigger value="pj" className="gap-2">
              <Building2 className="h-4 w-4" />
              Pessoa Jurídica
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{pjCount}</span>
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="all">
                <ClientsTable 
                  clients={clients} 
                  onEdit={handleEdit}
                  onView={handleView}
                  onDeactivate={handleDeactivateClient}
                />
              </TabsContent>
              <TabsContent value="pf">
                <ClientsTable 
                  clients={clients.filter(c => c.type === 'pf')} 
                  onEdit={handleEdit}
                  onView={handleView}
                  onDeactivate={handleDeactivateClient}
                />
              </TabsContent>
              <TabsContent value="pj">
                <ClientsTable 
                  clients={clients.filter(c => c.type === 'pj')} 
                  onEdit={handleEdit}
                  onView={handleView}
                  onDeactivate={handleDeactivateClient}
                />
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Pagination */}
        {totalCount > 0 && (
          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* Dialogs */}
      <ClientFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        client={editingClient}
        defaultType={formType}
      />

      <ImportClientsDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
      />

      <MergeClientsDialog
        open={isMergeOpen}
        onOpenChange={setIsMergeOpen}
        clients={allClients || []}
      />

      {/* Individual deactivation dialog */}
      <AlertDialog open={!!deactivatingClient} onOpenChange={(open) => !open && setDeactivatingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja inativar{' '}
              <strong>
                {deactivatingClient?.type === 'pf' ? deactivatingClient?.name : deactivatingClient?.company_name}
              </strong>
              ? O cliente não aparecerá mais nas listagens ativas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeactivateClient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Inativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk deactivation dialog */}
      <AlertDialog open={bulkDeactivateOpen} onOpenChange={setBulkDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar clientes sem receita</AlertDialogTitle>
            <AlertDialogDescription>
              {bulkCount === 0
                ? 'Nenhum cliente ativo sem receita nos últimos 90 dias foi encontrado.'
                : `Foram encontrados ${bulkCount} clientes ativos sem nenhuma receita nos últimos 90 dias. Deseja inativá-los?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {bulkCount > 0 && (
              <AlertDialogAction
                onClick={confirmBulkDeactivate}
                disabled={deactivateInactive.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deactivateInactive.isPending ? 'Inativando...' : `Inativar ${bulkCount} clientes`}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
