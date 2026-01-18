import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Lead } from '@/types/database';
import { useUpdateLead } from '@/hooks/useLeads';
import { useLossReasons } from '@/hooks/useConfiguration';

const schema = z.object({
  loss_reason_id: z.string().min(1, 'Selecione um motivo'),
  observations: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface MarkAsLostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSuccess?: () => void;
}

export function MarkAsLostDialog({ open, onOpenChange, lead, onSuccess }: MarkAsLostDialogProps) {
  const updateLead = useUpdateLead();
  const { data: lossReasons } = useLossReasons();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      loss_reason_id: '',
      observations: lead.observations || '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        loss_reason_id: '',
        observations: lead.observations || '',
      });
    }
  }, [open, lead]);

  const onSubmit = async (data: FormData) => {
    try {
      await updateLead.mutateAsync({
        id: lead.id,
        status: 'perdido',
        loss_reason_id: data.loss_reason_id,
        observations: data.observations || lead.observations,
      });

      toast.success('Lead marcado como perdido');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Erro ao atualizar lead');
    }
  };

  const isLoading = updateLead.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar como Perdido</DialogTitle>
          <DialogDescription>
            Selecione o motivo da perda do lead {lead.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="loss_reason_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da Perda *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o motivo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lossReasons?.filter(lr => lr.active).map((reason) => (
                        <SelectItem key={reason.id} value={reason.id}>
                          {reason.name}
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
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione observações sobre a perda..."
                      className="resize-none"
                      rows={3}
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
              <Button type="submit" variant="destructive" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Marcar como Perdido
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
