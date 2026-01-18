import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreatePartnerCommission, useUpdatePartnerCommission, PartnerCommission } from '@/hooks/usePartnerCommissions';
import { toast } from 'sonner';
import { useEffect } from 'react';

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  reference_month: z.string().min(1, 'Mês de referência obrigatório'),
  payment_date: z.string().optional(),
  status: z.enum(['pending', 'paid', 'cancelled']),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CommissionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  commission?: PartnerCommission;
}

export function CommissionFormDialog({
  open,
  onOpenChange,
  partnerId,
  commission,
}: CommissionFormDialogProps) {
  const createCommission = useCreatePartnerCommission();
  const updateCommission = useUpdatePartnerCommission();
  const isEditing = !!commission;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      reference_month: new Date().toISOString().slice(0, 7),
      payment_date: '',
      status: 'pending',
      notes: '',
    },
  });

  useEffect(() => {
    if (commission) {
      form.reset({
        amount: commission.amount,
        reference_month: commission.reference_month.slice(0, 7),
        payment_date: commission.payment_date?.slice(0, 10) || '',
        status: commission.status,
        notes: commission.notes || '',
      });
    } else {
      form.reset({
        amount: 0,
        reference_month: new Date().toISOString().slice(0, 7),
        payment_date: '',
        status: 'pending',
        notes: '',
      });
    }
  }, [commission, form, open]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        partner_id: partnerId,
        amount: data.amount,
        reference_month: data.reference_month + '-01',
        payment_date: data.payment_date || null,
        status: data.status,
        notes: data.notes || null,
      };

      if (isEditing) {
        await updateCommission.mutateAsync({ id: commission.id, ...payload });
        toast.success('Comissão atualizada com sucesso');
      } else {
        await createCommission.mutateAsync(payload);
        toast.success('Comissão registrada com sucesso');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar comissão');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Comissão' : 'Nova Comissão'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Altere os dados da comissão' : 'Registre uma nova comissão paga ao parceiro'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference_month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mês de Referência</FormLabel>
                  <FormControl>
                    <Input type="month" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data do Pagamento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre a comissão..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createCommission.isPending || updateCommission.isPending}>
                {isEditing ? 'Salvar' : 'Registrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
