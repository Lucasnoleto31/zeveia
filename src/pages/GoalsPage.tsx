import { useState } from 'react';
import { useGoals, useGoalProgress, useDeleteGoal, GOAL_TYPES } from '@/hooks/useGoals';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/contexts/AuthContext';
import { Goal } from '@/types/database';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { GoalFormDialog } from '@/components/goals/GoalFormDialog';
import { GoalCard } from '@/components/goals/GoalCard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Target,
  Users,
  DollarSign,
  TrendingUp,
  UserCheck,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function GoalsPage() {
  const { isSocio, user } = useAuth();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: profiles } = useProfiles();
  const { data: goalsWithProgress, isLoading } = useGoalProgress(
    selectedYear,
    selectedMonth,
    isSocio ? undefined : user?.id
  );
  const deleteGoal = useDeleteGoal();

  // Separate office and individual goals
  const officeGoals = goalsWithProgress?.filter(g => g.is_office_goal) || [];
  const individualGoals = goalsWithProgress?.filter(g => !g.is_office_goal) || [];

  // Group individual goals by assessor
  const goalsByAssessor: Record<string, typeof individualGoals> = {};
  individualGoals.forEach(goal => {
    const assessorId = goal.assessor_id || 'unknown';
    if (!goalsByAssessor[assessorId]) {
      goalsByAssessor[assessorId] = [];
    }
    goalsByAssessor[assessorId].push(goal);
  });

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteGoal.mutateAsync(deleteId);
      toast.success('Meta excluída com sucesso');
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir meta');
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const getAssessorName = (assessorId: string) => {
    return profiles?.find(p => p.user_id === assessorId)?.name || 'Desconhecido';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'clients_converted':
        return <UserCheck className="h-4 w-4" />;
      case 'revenue':
        return <DollarSign className="h-4 w-4" />;
      case 'lots_traded':
        return <TrendingUp className="h-4 w-4" />;
      case 'active_clients':
        return <Users className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getGoalLabel = (type: string) => {
    return GOAL_TYPES.find(t => t.value === type)?.label || type;
  };

  // Calculate overall progress
  const overallProgress = goalsWithProgress?.length
    ? goalsWithProgress.reduce((sum, g) => sum + g.progress, 0) / goalsWithProgress.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Metas</h1>
          <p className="text-muted-foreground">
            Defina e acompanhe as metas mensais
          </p>
        </div>
        {isSocio && (
          <Button onClick={() => {
            setEditingGoal(undefined);
            setFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Meta
          </Button>
        )}
      </div>

      {/* Month Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <Select
                  value={String(selectedMonth)}
                  onValueChange={(value) => setSelectedMonth(Number(value))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={index} value={String(index + 1)}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={String(selectedYear)}
                  onValueChange={(value) => setSelectedYear(Number(value))}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(year => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Overall Progress */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso Geral</span>
              <span className="text-sm font-bold">{overallProgress.toFixed(1)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="office" className="space-y-4">
          <TabsList>
            <TabsTrigger value="office" className="gap-2">
              <Building2 className="h-4 w-4" />
              Metas do Escritório
            </TabsTrigger>
            <TabsTrigger value="individual" className="gap-2">
              <Users className="h-4 w-4" />
              Metas Individuais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="office" className="space-y-4">
            {officeGoals.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">Nenhuma meta do escritório</h3>
                    <p className="text-muted-foreground">
                      {isSocio 
                        ? 'Defina metas para o escritório neste mês'
                        : 'Nenhuma meta definida para este mês'}
                    </p>
                    {isSocio && (
                      <Button className="mt-4" onClick={() => {
                        setEditingGoal(undefined);
                        setFormOpen(true);
                      }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Definir Meta
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {officeGoals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    icon={getGoalIcon(goal.type)}
                    label={getGoalLabel(goal.type)}
                    onEdit={isSocio ? () => handleEdit(goal) : undefined}
                    onDelete={isSocio ? () => setDeleteId(goal.id) : undefined}
                    formatValue={(v) => goal.type === 'revenue' ? formatCurrency(v) : v.toLocaleString('pt-BR')}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="individual" className="space-y-6">
            {Object.keys(goalsByAssessor).length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">Nenhuma meta individual</h3>
                    <p className="text-muted-foreground">
                      {isSocio 
                        ? 'Defina metas individuais para os assessores'
                        : 'Nenhuma meta definida para você neste mês'}
                    </p>
                    {isSocio && (
                      <Button className="mt-4" onClick={() => {
                        setEditingGoal(undefined);
                        setFormOpen(true);
                      }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Definir Meta
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              Object.entries(goalsByAssessor).map(([assessorId, goals]) => (
                <div key={assessorId} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm py-1 px-3">
                      {getAssessorName(assessorId)}
                    </Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {goals.map(goal => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        icon={getGoalIcon(goal.type)}
                        label={getGoalLabel(goal.type)}
                        onEdit={isSocio ? () => handleEdit(goal) : undefined}
                        onDelete={isSocio ? () => setDeleteId(goal.id) : undefined}
                        formatValue={(v) => goal.type === 'revenue' ? formatCurrency(v) : v.toLocaleString('pt-BR')}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Form Dialog */}
      <GoalFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        goal={editingGoal}
        year={selectedYear}
        month={selectedMonth}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
