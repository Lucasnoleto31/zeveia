import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { Lead } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { 
  Phone, 
  Mail, 
  MapPin, 
  GripVertical, 
  Pencil,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadCardProps {
  lead: Lead;
  onEdit?: () => void;
  isDragging?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
}

export function LeadCard({ lead, onEdit, isDragging, selectable, selected, onSelect }: LeadCardProps) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on edit button or drag handle
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/leads/${lead.id}`);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={cn(
        'cursor-pointer transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 shadow-lg rotate-2',
      )}
    >
      <CardContent className="p-3">
        {/* Header with drag handle */}
        <div className="flex items-start gap-2">
          {selectable && (
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => {
                onSelect?.(lead.id, !!checked);
              }}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5"
            />
          )}
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-sm truncate">{lead.name}</h4>
              <div className="flex items-center gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => { e.stopPropagation(); navigate(`/leads/${lead.id}`); }}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          {lead.email && (
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.state && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{lead.state}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1">
          {lead.origin && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {lead.origin.name}
            </Badge>
          )}
          {lead.campaign && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {lead.campaign.name}
            </Badge>
          )}
          {lead.partner && (
            <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary hover:bg-primary/20">
              {lead.partner.name}
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(lead.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
          {lead.loss_reason && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              {lead.loss_reason.name}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
