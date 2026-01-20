import { useState, useMemo } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, List, CalendarDays, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useTasks, useOverdueTasks, useTodayTasks, useUpcomingTasks } from '@/hooks/useTasks';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { CalendarView } from '@/components/tasks/CalendarView';
import { TaskWithRelations, TaskStatus, TaskPriority, TaskType } from '@/types/tasks';

export default function AgendaPage() {
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Data queries
  const { data: overdueTasks = [], isLoading: loadingOverdue } = useOverdueTasks();
  const { data: todayTasks = [], isLoading: loadingToday } = useTodayTasks();
  const { data: upcomingTasks = [], isLoading: loadingUpcoming } = useUpcomingTasks();

  // Build filters for main list
  const filters = useMemo(() => {
    const f: Record<string, unknown> = {};
    if (search) f.search = search;
    if (statusFilter && statusFilter !== 'all') f.status = statusFilter as TaskStatus;
    if (priorityFilter && priorityFilter !== 'all') f.priority = priorityFilter as TaskPriority;
    if (typeFilter && typeFilter !== 'all') f.type = typeFilter as TaskType;
    if (assigneeFilter && assigneeFilter !== 'all') f.assignee_id = assigneeFilter;
    if (selectedDate) {
      f.startDate = format(startOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss");
      f.endDate = format(endOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss");
    }
    return f;
  }, [search, statusFilter, priorityFilter, typeFilter, assigneeFilter, selectedDate]);

  const { data: filteredTasks = [], isLoading: loadingFiltered } = useTasks(filters);

  // All tasks for calendar view
  const { data: allTasks = [] } = useTasks({
    status: ['pendente', 'em_andamento'],
  });

  const isLoading = loadingOverdue || loadingToday || loadingUpcoming || loadingFiltered;

  const handleEdit = (task: TaskWithRelations) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setTaskDialogOpen(false);
    setEditingTask(null);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setTypeFilter('');
    setAssigneeFilter('');
    setSelectedDate(undefined);
  };

  // Metrics
  const overdueCount = overdueTasks.length;
  const todayCount = todayTasks.length;
  const weekCount = upcomingTasks.length;
  const completedThisMonth = filteredTasks.filter(
    (t) => t.status === 'concluida' && new Date(t.completed_at || '').getMonth() === new Date().getMonth()
  ).length;

  return (
    <MainLayout
      title="Agenda"
      actions={
        <Button onClick={() => setTaskDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </Button>
      }
    >
      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">tarefas pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos 7 dias</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekCount}</div>
            <p className="text-xs text-muted-foreground">tarefas agendadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas (mês)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedThisMonth}</div>
            <p className="text-xs text-muted-foreground">este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle and Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'calendar')}>
            <TabsList>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Calendário
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {selectedDate && (
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(undefined)}>
              Limpar data: {format(selectedDate, 'dd/MM/yyyy')}
            </Button>
          )}
        </div>

        <TaskFilters
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          priority={priorityFilter}
          onPriorityChange={setPriorityFilter}
          type={typeFilter}
          onTypeChange={setTypeFilter}
          assigneeId={assigneeFilter}
          onAssigneeChange={setAssigneeFilter}
          onClearFilters={clearFilters}
        />
      </div>

      {/* Content */}
      {view === 'list' ? (
        <div className="space-y-6">
          {/* Overdue Section */}
          {!selectedDate && overdueCount > 0 && !statusFilter && (
            <div>
              <h3 className="text-lg font-semibold text-destructive mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Atrasadas ({overdueCount})
              </h3>
              {loadingOverdue ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {overdueTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onEdit={handleEdit} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Filtered/All Tasks */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              {selectedDate
                ? `Tarefas de ${format(selectedDate, "d 'de' MMMM", { locale: ptBR })}`
                : 'Todas as Tarefas'}
              {filteredTasks.length > 0 && ` (${filteredTasks.length})`}
            </h3>
            {loadingFiltered ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma tarefa encontrada</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setTaskDialogOpen(true)}
                  >
                    Criar primeira tarefa
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onEdit={handleEdit} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          <CalendarView
            tasks={allTasks}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          <div>
            <h3 className="text-lg font-semibold mb-3">
              {selectedDate
                ? format(selectedDate, "d 'de' MMMM", { locale: ptBR })
                : 'Selecione um dia'}
            </h3>
            {selectedDate ? (
              loadingFiltered ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : filteredTasks.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p className="text-sm">Nenhuma tarefa neste dia</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setTaskDialogOpen(true)}
                    >
                      Criar tarefa
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {filteredTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onEdit={handleEdit} compact />
                  ))}
                </div>
              )
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Clique em um dia para ver as tarefas</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={handleCloseDialog}
        task={editingTask}
      />
    </MainLayout>
  );
}
