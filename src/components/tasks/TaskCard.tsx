import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Check, 
  Clock, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  User, 
  Users,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TaskWithRelations, TASK_PRIORITIES, TASK_TYPES } from '@/types/tasks';
import { useCompleteTask, useDeleteTask } from '@/hooks/useTasks';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: TaskWithRelations;
  onEdit?: (task: TaskWithRelations) => void;
  compact?: boolean;
}

const typeIcons: Record<string, React.ElementType> = {
  follow_up: MessageSquare,
  reuniao: Calendar,
  ligacao: Phone,
  email: Mail,
  outro: Clock,
};

export function TaskCard({ task, onEdit, compact = false }: TaskCardProps) {
  const navigate = useNavigate();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();

  const dueDate = new Date(task.due_date);
  const isOverdue = isPast(dueDate) && task.status !== 'concluida' && task.status !== 'cancelada';
  const isDueToday = isToday(dueDate);
  const isCompleted = task.status === 'concluida';

  const priorityConfig = TASK_PRIORITIES.find((p) => p.value === task.priority);
  const typeConfig = TASK_TYPES.find((t) => t.value === task.type);
  const TypeIcon = typeIcons[task.type] || Clock;

  const handleComplete = async () => {
    try {
      await completeTask.mutateAsync(task.id);
      toast.success('Tarefa concluída!');
    } catch (error) {
      toast.error('Erro ao concluir tarefa');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success('Tarefa excluída!');
    } catch (error) {
      toast.error('Erro ao excluir tarefa');
    }
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors',
          isOverdue && 'border-destructive/50 bg-destructive/5',
          isCompleted && 'opacity-60'
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-6 w-6 shrink-0 rounded-full border-2',
            isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'
          )}
          onClick={handleComplete}
          disabled={isCompleted || completeTask.isPending}
        >
          {isCompleted && <Check className="h-3 w-3" />}
        </Button>

        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium truncate', isCompleted && 'line-through')}>
            {task.title}
          </p>
          <p className={cn(
            'text-xs',
            isOverdue ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {format(dueDate, "dd/MM 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>

        <Badge className={cn('shrink-0 text-[10px]', priorityConfig?.color)}>
          {priorityConfig?.label}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={cn(
      'transition-all hover:shadow-md',
      isOverdue && 'border-destructive/50',
      isCompleted && 'opacity-60'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7 shrink-0 rounded-full border-2 mt-0.5',
                isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 hover:border-primary'
              )}
              onClick={handleComplete}
              disabled={isCompleted || completeTask.isPending}
            >
              {isCompleted && <Check className="h-4 w-4" />}
            </Button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={cn('font-medium', isCompleted && 'line-through')}>
                  {task.title}
                </h4>
                <Badge className={cn('text-[10px]', priorityConfig?.color)}>
                  {priorityConfig?.label}
                </Badge>
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <TypeIcon className="h-3.5 w-3.5" />
                  <span>{typeConfig?.label}</span>
                </div>

                <div className={cn(
                  'flex items-center gap-1',
                  isOverdue && 'text-destructive font-medium',
                  isDueToday && !isOverdue && 'text-primary font-medium'
                )}>
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {isOverdue && 'Atrasada: '}
                    {isDueToday && !isOverdue && 'Hoje: '}
                    {format(dueDate, "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                {task.client && (
                  <button
                    onClick={() => navigate(`/clients/${task.client?.id}`)}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>{task.client.name}</span>
                  </button>
                )}

                {task.lead && (
                  <button
                    onClick={() => navigate(`/leads/${task.lead?.id}`)}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>{task.lead.name}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(task)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
