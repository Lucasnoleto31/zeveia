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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateInfluencerNegotiation,
  useUpdateInfluencerNegotiation,
} from '@/hooks/useInfluencerNegotiations';
import {
  InfluencerNegotiation,
  INTERACTION_TYPE_OPTIONS,
  OUTCOME_OPTIONS,
} from '@/types/influencer';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const negotiationSchema = z.object({
  interaction_type: z.string().min(1, 'Tipo de interação é obrigatório'),
  description: z.string().trim().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  outcome: z.string().optional().or(z.literal('')),
  next_action: z.string().optional().or(z.literal('')),
  next_action_date: z.string().optional().or(z.literal('')),
});

type NegotiationFormData = z.infer<typeof negotiationSchema>;

interface NegotiationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  influencerId: string;
  negotiation?: InfluencerNegotiation;
}

export function NegotiationFormDialog({
  open,
  onOpenChange,
  influencerId,
  negotiation,
}: NegotiationFormDialogProps) {
  const { user } = useAuth();
  const createNegotiation = useCreateInfluencerNegotiation();
  const updateNegotiation = useUpdateInfluencerNegotiation();

  const form = useForm<NegotiationFormData>({
    resolver: zodResolver(negotiationSchema),
    defaultValues: {
      interaction_type: 'email',
      description: '',
      outcome: '',
      next_action: '',
      next_action_date: '',
    },
  });

  useEffect(() => {
    if (negotiation) {
      form.reset({
        interaction_type: negotiation.interaction_type,
        description: negotiation.description,
        outcome: negotiation.outcome || '',
        next_action: negotiation.next_action || '',
        next_action_date: negotiation.next_action_date || '',
      });
    } else {
      form.reset({
        interaction_type: 'email',
        description: '',
        outcome: '',
        next_action: '',
        next_action_date: '',
      });
    }
  }, [negotiation, form, open]);

  const onSubmit = async (data: NegotiationFormData) => {
    try {
      const payload: any = {
        influencer_id: influencerId,
        interaction_type: data.interaction_type,
        description: data.description,
        outcome: data.outcome || null,
        next_action: data.next_action || null,
        next_action_date: data.next_action_date || null,
        created_by: user?.id || null,
      };

      if (negotiation) {
        await updateNegotiation.mutateAsync({ id: negotiation.id, ...payload });
        toast.success('Negociação atualizada com sucesso');
      } else {
        await createNegotiation.mutateAsync(payload);
        toast.success('Negociação registrada com sucesso');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar negociação');
    }
  };

  const isSubmitting = createNegotiation.isPending || updateNegotiation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {negotiation ? 'Editar Negociação' : 'Nova Negociação'}
          </DialogTitle>
          <DialogDescription>
            {negotiation
              ? 'Atualize os dados da interação'
              : 'Registre uma nova interação com o influenciador'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="interaction_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Interação *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INTERACTION_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
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

            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resultado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o resultado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {OUTCOME_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
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
              name="next_action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Próxima Ação</FormLabel>
                  <FormControl>
                    <Input placeholder="O que fazer a seguir..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="next_action_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Próxima Ação</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                {negotiation ? 'Atualizar' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
