import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ClientFilters } from '@/components/clients/ClientFilters';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { ClientFormDialog } from '@/components/clients/ClientFormDialog';
import { ImportClientsDialog } from '@/components/clients/ImportClientsDialog';
import { MergeClientsDialog } from '@/components/clients/MergeClientsDialog';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';
import { useFindDuplicates } from '@/hooks/useMergeClients';
import { Client, ClientType, InvestorProfile } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Upload, Users, Building2, Loader2, GitMerge } from 'lucide-react';

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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formType, setFormType] = useState<ClientType>('pf');

  const { data: clients, isLoading } = useClients({
    search: filters.search || undefined,
    type: filters.type,
    profile: filters.profile,
    state: filters.state,
    partnerId: filters.partnerId,
    assessorId: isSocio ? filters.assessorId : user?.id,
    active: filters.active,
  });

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

  const pfCount = clients?.filter(c => c.type === 'pf').length || 0;
  const pjCount = clients?.filter(c => c.type === 'pj').length || 0;
  
  const duplicateGroups = useFindDuplicates(clients);
  const duplicateCount = duplicateGroups.length;

  return (
    <MainLayout title="Clientes">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <ClientFilters
            filters={filters}
            onFiltersChange={setFilters}
            showAssessorFilter={isSocio}
          />
          <div className="flex gap-2 flex-shrink-0">
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
                {clients?.length || 0}
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
                  clients={clients || []} 
                  onEdit={handleEdit}
                  onView={handleView}
                />
              </TabsContent>
              <TabsContent value="pf">
                <ClientsTable 
                  clients={clients?.filter(c => c.type === 'pf') || []} 
                  onEdit={handleEdit}
                  onView={handleView}
                />
              </TabsContent>
              <TabsContent value="pj">
                <ClientsTable 
                  clients={clients?.filter(c => c.type === 'pj') || []} 
                  onEdit={handleEdit}
                  onView={handleView}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
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
        clients={clients || []}
      />
    </MainLayout>
  );
}
