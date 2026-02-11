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
import { useBulkUpdateLeads } from '@/hooks/useLeads';
import { useLossReasons } from '@/hooks/useConfiguration';

const schema = z.object({
  loss_reason_id: z.string().min(1, 'Selecione um motivo'),
  observations: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface BulkMarkAsLostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: Set<string>;
  onSuccess?: () => void;
}

export function BulkMarkAsLostDialog({ open, onOpenChange, selectedIds, onSuccess }: BulkMarkAsLostDialogProps) {
  const bulkUpdate = useBulkUpdateLeads();
  const { data: lossReasons } = useLossReasons();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      loss_reason_id: '',
      observations: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ loss_reason_id: '', observations: '' });
    }
  }, [open]);

  const onSubmit = async (data: FormData) => {
    try {
      await bulkUpdate.mutateAsync({
        ids: Array.from(selectedIds),
        data: {
          status: 'perdido' as const,
          loss_reason_id: data.loss_reason_id,
          observations: data.observations || null,
          lost_at: new Date().toISOString(),
        },
      });

      toast.success(`${selectedIds.size} lead(s) marcado(s) como perdido`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error bulk updating leads:', error);
      toast.error('Erro ao atualizar leads');
    }
  };

  const isLoading = bulkUpdate.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar como Perdido em Massa</DialogTitle>
          <DialogDescription>
            {selectedIds.size} lead(s) serão marcados como perdido. Selecione o motivo da perda.
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
                Marcar {selectedIds.size} como Perdido
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
