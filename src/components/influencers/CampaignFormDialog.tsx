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
  useCreateInfluencerCampaign,
  useUpdateInfluencerCampaign,
} from '@/hooks/useInfluencerCampaigns';
import {
  InfluencerCampaign,
  CAMPAIGN_TYPE_OPTIONS,
  CAMPAIGN_STATUS_OPTIONS,
} from '@/types/influencer';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const campaignSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  campaign_type: z.string().min(1, 'Tipo é obrigatório'),
  status: z.string().min(1, 'Status é obrigatório'),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  tracking_code: z.string().optional().or(z.literal('')),
  budget: z.coerce.number().min(0).optional(),
  actual_cost: z.coerce.number().min(0).optional(),
  leads_generated: z.coerce.number().min(0).optional(),
  accounts_opened: z.coerce.number().min(0).optional(),
  contracts_generated: z.coerce.number().min(0).optional(),
  revenue_generated: z.coerce.number().min(0).optional(),
  notes: z.string().optional().or(z.literal('')),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  influencerId: string;
  campaign?: InfluencerCampaign;
}

export function CampaignFormDialog({
  open,
  onOpenChange,
  influencerId,
  campaign,
}: CampaignFormDialogProps) {
  const createCampaign = useCreateInfluencerCampaign();
  const updateCampaign = useUpdateInfluencerCampaign();

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      campaign_type: 'post',
      status: 'planned',
      start_date: '',
      end_date: '',
      tracking_code: '',
      budget: 0,
      actual_cost: 0,
      leads_generated: 0,
      accounts_opened: 0,
      contracts_generated: 0,
      revenue_generated: 0,
      notes: '',
    },
  });

  useEffect(() => {
    if (campaign) {
      form.reset({
        name: campaign.name,
        campaign_type: campaign.campaign_type,
        status: campaign.status,
        start_date: campaign.start_date || '',
        end_date: campaign.end_date || '',
        tracking_code: campaign.tracking_code || '',
        budget: Number(campaign.budget) || 0,
        actual_cost: Number(campaign.actual_cost) || 0,
        leads_generated: campaign.leads_generated || 0,
        accounts_opened: campaign.accounts_opened || 0,
        contracts_generated: campaign.contracts_generated || 0,
        revenue_generated: Number(campaign.revenue_generated) || 0,
        notes: campaign.notes || '',
      });
    } else {
      form.reset({
        name: '',
        campaign_type: 'post',
        status: 'planned',
        start_date: '',
        end_date: '',
        tracking_code: '',
        budget: 0,
        actual_cost: 0,
        leads_generated: 0,
        accounts_opened: 0,
        contracts_generated: 0,
        revenue_generated: 0,
        notes: '',
      });
    }
  }, [campaign, form, open]);

  const onSubmit = async (data: CampaignFormData) => {
    try {
      const payload: any = {
        influencer_id: influencerId,
        name: data.name,
        campaign_type: data.campaign_type,
        status: data.status,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        tracking_code: data.tracking_code || null,
        budget: data.budget || null,
        actual_cost: data.actual_cost || null,
        leads_generated: data.leads_generated || 0,
        accounts_opened: data.accounts_opened || 0,
        contracts_generated: data.contracts_generated || 0,
        revenue_generated: data.revenue_generated || 0,
        notes: data.notes || null,
      };

      if (campaign) {
        await updateCampaign.mutateAsync({ id: campaign.id, ...payload });
        toast.success('Campanha atualizada com sucesso');
      } else {
        await createCampaign.mutateAsync(payload);
        toast.success('Campanha criada com sucesso');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar campanha');
    }
  };

  const isSubmitting = createCampaign.isPending || updateCampaign.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {campaign ? 'Editar Campanha' : 'Nova Campanha'}
          </DialogTitle>
          <DialogDescription>
            {campaign
              ? 'Atualize os dados da campanha'
              : 'Crie uma nova campanha para este influenciador'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Campanha *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da campanha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="campaign_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CAMPAIGN_TYPE_OPTIONS.map((opt) => (
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CAMPAIGN_STATUS_OPTIONS.map((opt) => (
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Fim</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tracking_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Rastreamento</FormLabel>
                  <FormControl>
                    <Input placeholder="UTM ou código único" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orçamento (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="actual_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Real (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="leads_generated"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leads Gerados</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accounts_opened"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contas Abertas</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="contracts_generated"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contratos Gerados</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="revenue_generated"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receita Gerada (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas sobre a campanha..."
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {campaign ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
