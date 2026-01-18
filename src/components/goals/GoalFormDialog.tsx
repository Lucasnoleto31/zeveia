import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpsertGoal, useUpdateGoal, GOAL_TYPES } from '@/hooks/useGoals';
import { useProfiles } from '@/hooks/useProfiles';
import { Goal } from '@/types/database';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const goalSchema = z.object({
  year: z.coerce.number().min(2020).max(2100),
  month: z.coerce.number().min(1).max(12),
  type: z.string().min(1, 'Tipo é obrigatório'),
  target_value: z.coerce.number().min(0, 'Valor deve ser positivo'),
  is_office_goal: z.boolean(),
  assessor_id: z.string().optional(),
}).refine(data => data.is_office_goal || data.assessor_id, {
  message: 'Selecione um assessor ou marque como meta do escritório',
  path: ['assessor_id'],
});

type GoalFormData = z.infer<typeof goalSchema>;

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal;
  year: number;
  month: number;
}

export function GoalFormDialog({ open, onOpenChange, goal, year, month }: GoalFormDialogProps) {
  const upsertGoal = useUpsertGoal();
  const updateGoal = useUpdateGoal();
  const { data: profiles } = useProfiles();

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      year,
      month,
      type: 'revenue',
      target_value: 0,
      is_office_goal: true,
      assessor_id: '',
    },
  });

  const isOfficeGoal = form.watch('is_office_goal');

  useEffect(() => {
    if (goal) {
      form.reset({
        year: goal.year,
        month: goal.month,
        type: goal.type,
        target_value: Number(goal.target_value),
        is_office_goal: goal.is_office_goal,
        assessor_id: goal.assessor_id || '',
      });
    } else {
      form.reset({
        year,
        month,
        type: 'revenue',
        target_value: 0,
        is_office_goal: true,
        assessor_id: '',
      });
    }
  }, [goal, form, open, year, month]);

  const onSubmit = async (data: GoalFormData) => {
    try {
      const payload = {
        year: data.year,
        month: data.month,
        type: data.type,
        target_value: data.target_value,
        is_office_goal: data.is_office_goal,
        assessor_id: data.is_office_goal ? null : data.assessor_id || null,
      };

      if (goal) {
        await updateGoal.mutateAsync({ id: goal.id, ...payload });
        toast.success('Meta atualizada com sucesso');
      } else {
        await upsertGoal.mutateAsync(payload);
        toast.success('Meta definida com sucesso');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar meta');
    }
  };

  const isSubmitting = upsertGoal.isPending || updateGoal.isPending;
  const selectedType = form.watch('type');
  const isRevenueType = selectedType === 'revenue';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {goal ? 'Editar Meta' : 'Nova Meta'}
          </DialogTitle>
          <DialogDescription>
            {goal
              ? 'Atualize os dados da meta'
              : 'Defina uma nova meta mensal'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MONTHS.map((month, index) => (
                          <SelectItem key={index} value={String(index + 1)}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Meta</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GOAL_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Valor da Meta {isRevenueType && '(R$)'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={isRevenueType ? '0.01' : '1'}
                      min="0"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_office_goal"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Meta do Escritório</FormLabel>
                    <FormDescription>
                      Meta geral do escritório, visível para todos
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!isOfficeGoal && (
              <FormField
                control={form.control}
                name="assessor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o assessor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {profiles?.map(profile => (
                          <SelectItem key={profile.user_id} value={profile.user_id}>
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {goal ? 'Atualizar' : 'Definir Meta'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
