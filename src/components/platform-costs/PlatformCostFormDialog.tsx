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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreatePlatformCost, useUpdatePlatformCost } from '@/hooks/usePlatformCosts';
import { useClients } from '@/hooks/useClients';
import { usePlatforms } from '@/hooks/useConfiguration';
import { PlatformCost } from '@/types/database';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const costSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  platform_id: z.string().min(1, 'Plataforma é obrigatória'),
  value: z.coerce.number().min(0, 'Valor deve ser positivo'),
});

type CostFormData = z.infer<typeof costSchema>;

interface PlatformCostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cost?: PlatformCost;
}

export function PlatformCostFormDialog({ open, onOpenChange, cost }: PlatformCostFormDialogProps) {
  const createCost = useCreatePlatformCost();
  const updateCost = useUpdatePlatformCost();
  const { data: clients } = useClients({ active: true });
  const { data: platforms } = usePlatforms();

  const form = useForm<CostFormData>({
    resolver: zodResolver(costSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      client_id: '',
      platform_id: '',
      value: 0,
    },
  });

  useEffect(() => {
    if (cost) {
      form.reset({
        date: cost.date,
        client_id: cost.client_id,
        platform_id: cost.platform_id,
        value: Number(cost.value),
      });
    } else {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        client_id: '',
        platform_id: '',
        value: 0,
      });
    }
  }, [cost, form, open]);

  const onSubmit = async (data: CostFormData) => {
    try {
      const payload = {
        date: data.date,
        client_id: data.client_id,
        platform_id: data.platform_id,
        value: data.value,
      };

      if (cost) {
        await updateCost.mutateAsync({ id: cost.id, ...payload });
        toast.success('Custo atualizado com sucesso');
      } else {
        await createCost.mutateAsync(payload);
        toast.success('Custo registrado com sucesso');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar custo');
    }
  };

  const isSubmitting = createCost.isPending || updateCost.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {cost ? 'Editar Custo' : 'Novo Custo de Plataforma'}
          </DialogTitle>
          <DialogDescription>
            {cost
              ? 'Atualize os dados do custo'
              : 'Registre um novo custo mensal de plataforma'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
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
              name="platform_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plataforma</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a plataforma" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {platforms?.filter(p => p.active).map((platform) => (
                        <SelectItem key={platform.id} value={platform.id}>
                          {platform.name}
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
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {cost ? 'Atualizar' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
