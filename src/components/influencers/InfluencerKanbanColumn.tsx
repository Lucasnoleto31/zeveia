import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { InfluencerStage } from '@/types/influencer';

interface InfluencerKanbanColumnProps {
  id: InfluencerStage;
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

export function InfluencerKanbanColumn({
  id,
  title,
  color,
  count,
  children,
}: InfluencerKanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-72 bg-muted/30 rounded-lg p-3 transition-colors',
        isOver && 'bg-muted/50 ring-2 ring-primary ring-offset-2'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('w-3 h-3 rounded-full', color)} />
        <h3 className="font-semibold text-sm flex-1">{title}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>

      {/* Cards Container */}
      <div className="space-y-2 min-h-[200px]">{children}</div>
    </div>
  );
}
