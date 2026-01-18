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
import { useCreatePartner, useUpdatePartner } from '@/hooks/usePartners';
import { Partner } from '@/types/database';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const partnerSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  email: z.string().trim().email('E-mail inválido').max(255, 'E-mail muito longo').optional().or(z.literal('')),
  phone: z.string().trim().max(20, 'Telefone muito longo').optional().or(z.literal('')),
  type: z.enum(['parceiro', 'influenciador'], { required_error: 'Tipo é obrigatório' }),
  commission_percentage: z.coerce.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%'),
  active: z.boolean(),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

interface PartnerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner?: Partner;
}

export function PartnerFormDialog({ open, onOpenChange, partner }: PartnerFormDialogProps) {
  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner();

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      type: 'parceiro',
      commission_percentage: 0,
      active: true,
    },
  });

  useEffect(() => {
    if (partner) {
      form.reset({
        name: partner.name,
        email: partner.email || '',
        phone: partner.phone || '',
        type: partner.type,
        commission_percentage: partner.commission_percentage,
        active: partner.active,
      });
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        type: 'parceiro',
        commission_percentage: 0,
        active: true,
      });
    }
  }, [partner, form, open]);

  const onSubmit = async (data: PartnerFormData) => {
    try {
      const payload = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        type: data.type,
        commission_percentage: data.commission_percentage,
        active: data.active,
      };

      if (partner) {
        await updatePartner.mutateAsync({ id: partner.id, ...payload });
        toast.success('Parceiro atualizado com sucesso');
      } else {
        await createPartner.mutateAsync(payload);
        toast.success('Parceiro criado com sucesso');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar parceiro');
    }
  };

  const isSubmitting = createPartner.isPending || updatePartner.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {partner ? 'Editar Parceiro' : 'Novo Parceiro'}
          </DialogTitle>
          <DialogDescription>
            {partner
              ? 'Atualize os dados do parceiro'
              : 'Cadastre um novo parceiro ou influenciador'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do parceiro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="parceiro">Parceiro</SelectItem>
                      <SelectItem value="influenciador">Influenciador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="commission_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comissão (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Percentual de comissão sobre as receitas dos clientes indicados
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativo</FormLabel>
                    <FormDescription>
                      Parceiros inativos não aparecem nas listagens de seleção
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {partner ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
