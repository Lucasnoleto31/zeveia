import { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskWithRelations, TASK_PRIORITIES } from '@/types/tasks';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  tasks: TaskWithRelations[];
  onSelectDate: (date: Date) => void;
  selectedDate?: Date;
}

export function CalendarView({ tasks, onSelectDate, selectedDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { locale: ptBR });
    const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskWithRelations[]>();
    tasks.forEach((task) => {
      const dateKey = format(new Date(task.due_date), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, task]);
    });
    return map;
  }, [tasks]);

  const previousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    onSelectDate(new Date());
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-card border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-2 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Hoje
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayTasks = tasksByDate.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isDayToday = isToday(day);
            const pendingTasks = dayTasks.filter(
              (t) => t.status === 'pendente' || t.status === 'em_andamento'
            );

            // Get highest priority
            const highestPriority = pendingTasks.reduce<string | null>((acc, task) => {
              const priorities = ['urgente', 'alta', 'media', 'baixa'];
              const currentIndex = priorities.indexOf(task.priority);
              const accIndex = acc ? priorities.indexOf(acc) : 4;
              return currentIndex < accIndex ? task.priority : acc;
            }, null);

            const priorityConfig = highestPriority
              ? TASK_PRIORITIES.find((p) => p.value === highestPriority)
              : null;

            return (
              <button
                key={dateKey}
                onClick={() => onSelectDate(day)}
                className={cn(
                  'relative h-20 p-1 rounded-lg border transition-all text-left',
                  'hover:bg-accent hover:border-accent-foreground/20',
                  !isCurrentMonth && 'opacity-40',
                  isSelected && 'bg-primary/10 border-primary',
                  isDayToday && !isSelected && 'border-primary/50'
                )}
              >
                <span
                  className={cn(
                    'text-sm font-medium',
                    isDayToday && 'text-primary font-bold',
                    isSelected && 'text-primary'
                  )}
                >
                  {format(day, 'd')}
                </span>

                {pendingTasks.length > 0 && (
                  <div className="absolute bottom-1 left-1 right-1">
                    <Badge
                      className={cn(
                        'w-full justify-center text-[10px] px-1',
                        priorityConfig?.color || 'bg-muted text-muted-foreground'
                      )}
                    >
                      {pendingTasks.length} {pendingTasks.length === 1 ? 'tarefa' : 'tarefas'}
                    </Badge>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
