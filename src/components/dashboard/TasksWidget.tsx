import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTodayTasks, useOverdueTasks } from '@/hooks/useTasks';
import { TaskCard } from '@/components/tasks/TaskCard';

export function TasksWidget() {
  const navigate = useNavigate();
  const { data: todayTasks, isLoading: loadingToday } = useTodayTasks();
  const { data: overdueTasks, isLoading: loadingOverdue } = useOverdueTasks();

  const isLoading = loadingToday || loadingOverdue;

  // Combine and limit tasks to show
  const tasksToShow = [
    ...(overdueTasks || []).slice(0, 2),
    ...(todayTasks || []).slice(0, 3 - Math.min(overdueTasks?.length || 0, 2)),
  ].slice(0, 3);

  const overdueCount = overdueTasks?.length || 0;
  const todayCount = todayTasks?.length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tarefas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-5 w-5" />
          Tarefas de Hoje
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate('/agenda')} className="gap-1">
          Ver agenda
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {overdueCount > 0 && (
          <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {overdueCount} {overdueCount === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}
            </span>
          </div>
        )}

        {tasksToShow.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma tarefa para hoje</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasksToShow.map((task) => (
              <TaskCard key={task.id} task={task} compact />
            ))}
          </div>
        )}

        {(todayCount > 3 || overdueCount > 2) && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            +{Math.max(0, todayCount - 3 + overdueCount - 2)} outras tarefas
          </p>
        )}
      </CardContent>
    </Card>
  );
}
