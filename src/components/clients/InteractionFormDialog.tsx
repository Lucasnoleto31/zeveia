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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCreateInteraction, INTERACTION_TYPES } from '@/hooks/useInteractions';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  type: z.string().min(1, 'Selecione o tipo'),
  content: z.string().min(3, 'Descreva a interação').max(2000),
});

type FormData = z.infer<typeof schema>;

interface InteractionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  leadId?: string;
}

export function InteractionFormDialog({ 
  open, 
  onOpenChange, 
  clientId,
  leadId 
}: InteractionFormDialogProps) {
  const { user } = useAuth();
  const createInteraction = useCreateInteraction();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: '',
      content: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        type: '',
        content: '',
      });
    }
  }, [open, form]);

  const onSubmit = async (data: FormData) => {
    try {
      await createInteraction.mutateAsync({
        type: data.type,
        content: data.content,
        client_id: clientId || null,
        lead_id: leadId || null,
        user_id: user!.id,
        scheduled_at: null,
        completed_at: new Date().toISOString(),
      });

      toast.success('Interação registrada com sucesso!');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registrar interação');
    }
  };

  const isLoading = createInteraction.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Interação</DialogTitle>
          <DialogDescription>
            Registre uma interação com o {clientId ? 'cliente' : 'lead'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Interação</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INTERACTION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </span>
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
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva a interação..."
                      className="resize-none"
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
