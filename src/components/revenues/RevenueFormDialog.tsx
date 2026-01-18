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
import { useCreateRevenue, useUpdateRevenue } from '@/hooks/useRevenues';
import { useClients } from '@/hooks/useClients';
import { useProducts, useSubproducts } from '@/hooks/useConfiguration';
import { Revenue } from '@/types/database';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const revenueSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  product_id: z.string().min(1, 'Produto é obrigatório'),
  subproduct_id: z.string().optional(),
  gross_revenue: z.coerce.number().min(0, 'Valor inválido'),
  taxes: z.coerce.number().min(0, 'Valor inválido'),
  bank_share: z.coerce.number().min(0, 'Valor inválido'),
  our_share: z.coerce.number().min(0, 'Valor inválido'),
});

type RevenueFormData = z.infer<typeof revenueSchema>;

interface RevenueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revenue?: Revenue;
}

export function RevenueFormDialog({ open, onOpenChange, revenue }: RevenueFormDialogProps) {
  const createRevenue = useCreateRevenue();
  const updateRevenue = useUpdateRevenue();
  const { data: clients } = useClients({ active: true });
  const { data: products } = useProducts();

  const form = useForm<RevenueFormData>({
    resolver: zodResolver(revenueSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      client_id: '',
      product_id: '',
      subproduct_id: '',
      gross_revenue: 0,
      taxes: 0,
      bank_share: 0,
      our_share: 0,
    },
  });

  const selectedProductId = form.watch('product_id');
  const { data: subproducts } = useSubproducts(selectedProductId);

  // Auto-calculate our_share when other values change
  const grossRevenue = form.watch('gross_revenue');
  const taxes = form.watch('taxes');
  const bankShare = form.watch('bank_share');

  useEffect(() => {
    const ourShare = Number(grossRevenue) - Number(taxes) - Number(bankShare);
    form.setValue('our_share', ourShare >= 0 ? ourShare : 0);
  }, [grossRevenue, taxes, bankShare, form]);

  useEffect(() => {
    if (revenue) {
      form.reset({
        date: revenue.date,
        client_id: revenue.client_id,
        product_id: revenue.product_id,
        subproduct_id: revenue.subproduct_id || '',
        gross_revenue: Number(revenue.gross_revenue),
        taxes: Number(revenue.taxes),
        bank_share: Number(revenue.bank_share),
        our_share: Number(revenue.our_share),
      });
    } else {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        client_id: '',
        product_id: '',
        subproduct_id: '',
        gross_revenue: 0,
        taxes: 0,
        bank_share: 0,
        our_share: 0,
      });
    }
  }, [revenue, form, open]);

  const onSubmit = async (data: RevenueFormData) => {
    try {
      const payload = {
        date: data.date,
        client_id: data.client_id,
        product_id: data.product_id,
        subproduct_id: data.subproduct_id || null,
        gross_revenue: data.gross_revenue,
        taxes: data.taxes,
        bank_share: data.bank_share,
        our_share: data.our_share,
      };

      if (revenue) {
        await updateRevenue.mutateAsync({ id: revenue.id, ...payload });
        toast.success('Receita atualizada com sucesso');
      } else {
        await createRevenue.mutateAsync(payload);
        toast.success('Receita criada com sucesso');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar receita');
    }
  };

  const isSubmitting = createRevenue.isPending || updateRevenue.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {revenue ? 'Editar Receita' : 'Nova Receita'}
          </DialogTitle>
          <DialogDescription>
            {revenue
              ? 'Atualize os dados da receita'
              : 'Preencha os dados para registrar uma nova receita'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products?.filter(p => p.active).map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
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
                name="subproduct_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subproduto</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} 
                      value={field.value || 'none'}
                      disabled={!selectedProductId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Opcional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {subproducts?.filter(s => s.active).map((subproduct) => (
                          <SelectItem key={subproduct.id} value={subproduct.id}>
                            {subproduct.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="gross_revenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receita Bruta (R$)</FormLabel>
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

              <FormField
                control={form.control}
                name="taxes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impostos (R$)</FormLabel>
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="bank_share"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repasse Banco (R$)</FormLabel>
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

              <FormField
                control={form.control}
                name="our_share"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nossa Parte (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                        className="bg-muted"
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {revenue ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
