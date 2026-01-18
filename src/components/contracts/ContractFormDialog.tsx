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
import { useCreateContract, useUpdateContract } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { useAssets, usePlatforms } from '@/hooks/useConfiguration';
import { Contract } from '@/types/database';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const contractSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  asset_id: z.string().min(1, 'Ativo é obrigatório'),
  platform_id: z.string().min(1, 'Plataforma é obrigatória'),
  lots_traded: z.coerce.number().int().min(0, 'Valor inválido'),
  lots_zeroed: z.coerce.number().int().min(0, 'Valor inválido'),
}).refine(data => data.lots_zeroed <= data.lots_traded, {
  message: 'Lotes zerados não pode ser maior que lotes operados',
  path: ['lots_zeroed'],
});

type ContractFormData = z.infer<typeof contractSchema>;

interface ContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: Contract;
}

export function ContractFormDialog({ open, onOpenChange, contract }: ContractFormDialogProps) {
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const { data: clients } = useClients({ active: true });
  const { data: assets } = useAssets();
  const { data: platforms } = usePlatforms();

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      client_id: '',
      asset_id: '',
      platform_id: '',
      lots_traded: 0,
      lots_zeroed: 0,
    },
  });

  useEffect(() => {
    if (contract) {
      form.reset({
        date: contract.date,
        client_id: contract.client_id,
        asset_id: contract.asset_id,
        platform_id: contract.platform_id,
        lots_traded: contract.lots_traded,
        lots_zeroed: contract.lots_zeroed,
      });
    } else {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        client_id: '',
        asset_id: '',
        platform_id: '',
        lots_traded: 0,
        lots_zeroed: 0,
      });
    }
  }, [contract, form, open]);

  const onSubmit = async (data: ContractFormData) => {
    try {
      const payload = {
        date: data.date,
        client_id: data.client_id,
        asset_id: data.asset_id,
        platform_id: data.platform_id,
        lots_traded: data.lots_traded,
        lots_zeroed: data.lots_zeroed,
      };

      if (contract) {
        await updateContract.mutateAsync({ id: contract.id, ...payload });
        toast.success('Contrato atualizado com sucesso');
      } else {
        await createContract.mutateAsync(payload);
        toast.success('Contrato criado com sucesso');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar contrato');
    }
  };

  const isSubmitting = createContract.isPending || updateContract.isPending;
  const lotsTraded = form.watch('lots_traded');
  const lotsZeroed = form.watch('lots_zeroed');
  const zeroRate = lotsTraded > 0 ? ((lotsZeroed / lotsTraded) * 100).toFixed(1) : '0.0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {contract ? 'Editar Contrato' : 'Novo Contrato'}
          </DialogTitle>
          <DialogDescription>
            {contract
              ? 'Atualize os dados do contrato'
              : 'Registre um novo contrato day trade'}
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
                name="asset_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ativo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ativo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assets?.filter(a => a.active).map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.code} {asset.name && `- ${asset.name}`}
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="lots_traded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lotes Operados</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
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
                name="lots_zeroed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lotes Zerados</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {lotsTraded > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Taxa de Zeramento</p>
                <p className="text-2xl font-bold text-primary">{zeroRate}%</p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {contract ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
