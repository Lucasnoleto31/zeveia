import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import { useProducts, useCampaigns } from '@/hooks/useConfiguration';
import { useCreateOpportunity } from '@/hooks/useClientOpportunities';
import { Client, Product } from '@/types/database';
import { toast } from 'sonner';
import { Target, Package, Megaphone } from 'lucide-react';

const formSchema = z.object({
  targetProductId: z.string().min(1, 'Selecione um produto'),
  campaignId: z.string().optional(),
  observations: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  unusedProducts?: Product[];
}

export function CreateOpportunityDialog({
  open,
  onOpenChange,
  client,
  unusedProducts = [],
}: CreateOpportunityDialogProps) {
  const { data: allProducts } = useProducts();
  const { data: campaigns } = useCampaigns();
  const createOpportunity = useCreateOpportunity();

  // Use unused products if provided, otherwise use all products
  const availableProducts = unusedProducts.length > 0 ? unusedProducts : (allProducts?.filter(p => p.active) || []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetProductId: '',
      campaignId: '',
      observations: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        targetProductId: '',
        campaignId: '',
        observations: '',
      });
    }
  }, [open, form]);

  const onSubmit = async (data: FormData) => {
    try {
      await createOpportunity.mutateAsync({
        clientId: client.id,
        clientName: client.type === 'pf' ? client.name : (client.company_name || client.name),
        clientEmail: client.email,
        clientPhone: client.phone,
        clientState: client.state,
        targetProductId: data.targetProductId,
        campaignId: data.campaignId || null,
        observations: data.observations || null,
      });

      const productName = availableProducts.find(p => p.id === data.targetProductId)?.name || 'Produto';
      toast.success(`Oportunidade de ${productName} criada com sucesso!`);
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erro ao criar oportunidade: ' + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Nova Oportunidade de Negócio
          </DialogTitle>
          <DialogDescription>
            Criar uma nova oportunidade de cross-selling ou reativação para{' '}
            <span className="font-medium text-foreground">
              {client.type === 'pf' ? client.name : client.company_name}
            </span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="targetProductId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Produto Alvo *
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {unusedProducts.length > 0 
                      ? 'Produtos que o cliente ainda não possui'
                      : 'Todos os produtos disponíveis'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="campaignId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    Campanha
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma campanha (opcional)..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {campaigns?.filter(c => c.active).map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
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
                      placeholder="Contexto da oportunidade, notas relevantes..."
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
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createOpportunity.isPending}>
                {createOpportunity.isPending ? 'Criando...' : 'Criar Oportunidade'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
