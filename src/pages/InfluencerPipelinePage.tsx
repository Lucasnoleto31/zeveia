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
import { InfluencerKanbanColumn } from '@/components/influencers/InfluencerKanbanColumn';
import { InfluencerCard } from '@/components/influencers/InfluencerCard';
import { InfluencerFormDialog } from '@/components/influencers/InfluencerFormDialog';
import {
  useInfluencers,
  useUpdateInfluencerStage,
} from '@/hooks/useInfluencers';
import {
  InfluencerProfile,
  InfluencerStage,
  INFLUENCER_STAGES,
  NICHE_OPTIONS,
} from '@/types/influencer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2, Search, X, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface PipelineFilters {
  search: string;
  niche?: string;
}

export default function InfluencerPipelinePage() {
  const [filters, setFilters] = useState<PipelineFilters>({ search: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<
    InfluencerProfile | undefined
  >();
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: influencers, isLoading } = useInfluencers({
    search: filters.search || undefined,
    niche: filters.niche,
  });

  const updateStage = useUpdateInfluencerStage();

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

  const getInfluencersByStage = (stage: InfluencerStage) => {
    return influencers?.filter((inf) => inf.stage === stage) || [];
  };

  const activeInfluencer = activeId
    ? influencers?.find((inf) => inf.id === activeId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Handle drag over logic if needed
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const influencerId = active.id as string;
    const newStage = over.id as InfluencerStage;

    const influencer = influencers?.find((inf) => inf.id === influencerId);
    if (!influencer || influencer.stage === newStage) return;

    // Prevent moving from lost/paused
    if (influencer.stage === 'lost' || influencer.stage === 'paused') {
      toast.error('Não é possível mover influenciadores já finalizados');
      return;
    }

    try {
      await updateStage.mutateAsync({ id: influencerId, stage: newStage });
      const stageLabel =
        INFLUENCER_STAGES.find((s) => s.id === newStage)?.title || newStage;
      toast.success(`Influenciador movido para "${stageLabel}"`);
    } catch (error) {
      toast.error('Erro ao atualizar estágio');
    }
  };

  const handleEdit = (influencer: InfluencerProfile) => {
    setEditingInfluencer(influencer);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingInfluencer(undefined);
  };

  const hasActiveFilters = filters.search || filters.niche;

  const clearFilters = () => {
    setFilters({ search: '' });
  };

  return (
    <MainLayout title="Prospecção de Influenciadores">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-2 items-center flex-1">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar influenciador..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pl-9"
              />
            </div>

            <Select
              value={filters.niche || 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  niche: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Nicho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os nichos</SelectItem>
                {NICHE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Filter className="h-3 w-3" />
                  Filtros ativos
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              </div>
            )}
          </div>

          <Button
            onClick={() => {
              setEditingInfluencer(undefined);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Influenciador
          </Button>
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
              {INFLUENCER_STAGES.map((column) => (
                <InfluencerKanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  color={column.color}
                  count={getInfluencersByStage(column.id).length}
                >
                  {getInfluencersByStage(column.id).map((influencer) => (
                    <InfluencerCard
                      key={influencer.id}
                      influencer={influencer}
                      onEdit={() => handleEdit(influencer)}
                    />
                  ))}
                </InfluencerKanbanColumn>
              ))}
            </div>

            <DragOverlay>
              {activeInfluencer ? (
                <InfluencerCard influencer={activeInfluencer} isDragging />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Form Dialog */}
      <InfluencerFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        influencer={editingInfluencer}
      />
    </MainLayout>
  );
}
