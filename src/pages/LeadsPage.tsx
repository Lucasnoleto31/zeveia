import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { MainLayout } from '@/components/layout/MainLayout';
import { KanbanColumn } from '@/components/leads/KanbanColumn';
import { LeadCard } from '@/components/leads/LeadCard';
import { LeadFilters } from '@/components/leads/LeadFilters';
import { LeadFormDialog } from '@/components/leads/LeadFormDialog';
import { BulkMarkAsLostDialog } from '@/components/leads/BulkMarkAsLostDialog';
import { useLeads, useUpdateLead, LeadType } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { Lead, LeadStatus } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Loader2, X, Trash2, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { ImportLeadsDialog } from '@/components/leads/ImportLeadsDialog';

const columns: { id: LeadStatus; title: string; color: string }[] = [
  { id: 'novo', title: 'Novo', color: 'bg-blue-500' },
  { id: 'em_contato', title: 'Em Contato', color: 'bg-yellow-500' },
  { id: 'troca_assessoria', title: 'Troca de Assessoria', color: 'bg-purple-500' },
  { id: 'convertido', title: 'Convertido', color: 'bg-green-500' },
  { id: 'perdido', title: 'Perdido', color: 'bg-red-500' },
];

interface LeadFiltersState {
  search: string;
  originId?: string;
  campaignId?: string;
  partnerId?: string;
  assessorId?: string;
  leadType?: LeadType;
}

export default function LeadsPage() {
  const { user, isSocio } = useAuth();
  const [filters, setFilters] = useState<LeadFiltersState>({ search: '', leadType: 'all' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isBulkLostOpen, setIsBulkLostOpen] = useState(false);

  const { data: leads, isLoading } = useLeads({
    search: filters.search || undefined,
    originId: filters.originId,
    campaignId: filters.campaignId,
    partnerId: filters.partnerId,
    assessorId: isSocio 
      ? (filters.assessorId === 'all' ? undefined : (filters.assessorId || user?.id))
      : user?.id,
    leadType: filters.leadType,
  });

  const updateLead = useUpdateLead();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads?.filter((lead) => lead.status === status) || [];
  };

  const activeLead = activeId ? leads?.find((l) => l.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over logic if needed
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;

    const lead = leads?.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    try {
      await updateLead.mutateAsync({
        id: leadId,
        status: newStatus,
        ...(newStatus === 'convertido' ? { converted_at: new Date().toISOString() } : {}),
      });
      toast.success(`Lead movido para "${columns.find(c => c.id === newStatus)?.title}"`);
    } catch (error) {
      toast.error('Erro ao atualizar lead');
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingLead(null);
  };

  const handleSelectLead = (id: string, checked: boolean) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const novoLeads = getLeadsByStatus('novo');

  const handleSelectAll = () => {
    setSelectedLeadIds(new Set(novoLeads.map(l => l.id)));
  };

  const handleDeselectAll = () => {
    setSelectedLeadIds(new Set());
  };

  const handleBulkLostSuccess = () => {
    setSelectedLeadIds(new Set());
  };

  return (
    <MainLayout title="Leads">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <LeadFilters
            filters={filters}
            onFiltersChange={setFilters}
            showAssessorFilter={isSocio}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar Excel
            </Button>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  color={column.color}
                  count={getLeadsByStatus(column.id).length}
                >
                  {getLeadsByStatus(column.id).map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onEdit={() => handleEdit(lead)}
                      selectable={column.id === 'novo'}
                      selected={selectedLeadIds.has(lead.id)}
                      onSelect={handleSelectLead}
                    />
                  ))}
                </KanbanColumn>
              ))}
            </div>

            <DragOverlay>
              {activeLead ? (
                <LeadCard lead={activeLead} isDragging />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Dialogs */}
      <LeadFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        lead={editingLead}
      />

      <ImportLeadsDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
      />

      <BulkMarkAsLostDialog
        open={isBulkLostOpen}
        onOpenChange={setIsBulkLostOpen}
        selectedIds={selectedLeadIds}
        onSuccess={handleBulkLostSuccess}
      />

      {/* Bulk Action Bar */}
      {selectedLeadIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background rounded-lg shadow-xl px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium">
            {selectedLeadIds.size} lead(s) selecionado(s)
          </span>
          <div className="h-4 w-px bg-background/30" />
          <Button size="sm" variant="ghost" className="text-background hover:text-background/80 hover:bg-background/10" onClick={handleSelectAll}>
            <CheckSquare className="h-4 w-4 mr-1" />
            Selecionar todos
          </Button>
          <Button size="sm" variant="ghost" className="text-background hover:text-background/80 hover:bg-background/10" onClick={handleDeselectAll}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setIsBulkLostOpen(true)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Marcar como Perdido
          </Button>
        </div>
      )}
    </MainLayout>
  );
}
