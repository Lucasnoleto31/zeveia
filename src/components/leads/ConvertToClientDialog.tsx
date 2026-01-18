import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Lead, ClientType, InvestorProfile } from '@/types/database';
import { useCreateClient } from '@/hooks/useClients';
import { useUpdateLead } from '@/hooks/useLeads';

const INVESTOR_PROFILES: InvestorProfile[] = ['conservador', 'moderado', 'arrojado', 'agressivo'];

const pfSchema = z.object({
  cpf: z.string().min(11, 'CPF inválido').max(14),
  account_number: z.string().optional(),
  patrimony: z.coerce.number().min(0).optional(),
  profile: z.string().optional(),
});

const pjSchema = z.object({
  cnpj: z.string().min(14, 'CNPJ inválido').max(18),
  company_name: z.string().min(1, 'Razão social obrigatória'),
  trade_name: z.string().optional(),
  responsible_name: z.string().optional(),
  responsible_cpf: z.string().optional(),
  responsible_position: z.string().optional(),
  account_number: z.string().optional(),
  patrimony: z.coerce.number().min(0).optional(),
  profile: z.string().optional(),
});

type PFFormData = z.infer<typeof pfSchema>;
type PJFormData = z.infer<typeof pjSchema>;

interface ConvertToClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

export function ConvertToClientDialog({ open, onOpenChange, lead }: ConvertToClientDialogProps) {
  const navigate = useNavigate();
  const [clientType, setClientType] = useState<ClientType>('pf');
  const createClient = useCreateClient();
  const updateLead = useUpdateLead();

  const pfForm = useForm<PFFormData>({
    resolver: zodResolver(pfSchema),
    defaultValues: {
      cpf: '',
      account_number: '',
      patrimony: undefined,
      profile: '',
    },
  });

  const pjForm = useForm<PJFormData>({
    resolver: zodResolver(pjSchema),
    defaultValues: {
      cnpj: '',
      company_name: '',
      trade_name: '',
      responsible_name: '',
      responsible_cpf: '',
      responsible_position: '',
      account_number: '',
      patrimony: undefined,
      profile: '',
    },
  });

  useEffect(() => {
    if (open) {
      pfForm.reset();
      pjForm.reset();
      setClientType('pf');
    }
  }, [open]);

  const handleSubmit = async (data: PFFormData | PJFormData) => {
    try {
      const clientData = {
        type: clientType,
        name: lead.name,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        state: lead.state || undefined,
        origin_id: lead.origin_id || undefined,
        campaign_id: lead.campaign_id || undefined,
        partner_id: lead.partner_id || undefined,
        assessor_id: lead.assessor_id,
        converted_from_lead_id: lead.id,
        active: true,
        observations: lead.observations || undefined,
        ...data,
        profile: (data.profile && data.profile !== 'none' ? data.profile : undefined) as InvestorProfile | undefined,
        patrimony: data.patrimony || undefined,
      };

      const newClient = await createClient.mutateAsync(clientData);

      await updateLead.mutateAsync({
        id: lead.id,
        status: 'convertido',
        converted_at: new Date().toISOString(),
      });

      toast.success('Lead convertido para cliente com sucesso!');
      onOpenChange(false);
      navigate(`/clients/${newClient.id}`);
    } catch (error) {
      console.error('Error converting lead:', error);
      toast.error('Erro ao converter lead para cliente');
    }
  };

  const isLoading = createClient.isPending || updateLead.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Converter para Cliente</DialogTitle>
          <DialogDescription>
            Preencha os dados adicionais para criar o cliente a partir de {lead.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={clientType} onValueChange={(v) => setClientType(v as ClientType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pf">Pessoa Física</TabsTrigger>
            <TabsTrigger value="pj">Pessoa Jurídica</TabsTrigger>
          </TabsList>

          <TabsContent value="pf">
            <Form {...pfForm}>
              <form onSubmit={pfForm.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={pfForm.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pfForm.control}
                  name="account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Conta</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pfForm.control}
                  name="patrimony"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patrimônio (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pfForm.control}
                  name="profile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perfil de Investidor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'none'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Não informado</SelectItem>
                          {INVESTOR_PROFILES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Converter
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="pj">
            <Form {...pjForm}>
              <form onSubmit={pjForm.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={pjForm.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razão Social *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pjForm.control}
                  name="trade_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Fantasia</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome fantasia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pjForm.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ *</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pjForm.control}
                  name="responsible_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pjForm.control}
                  name="account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Conta</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pjForm.control}
                  name="patrimony"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patrimônio (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pjForm.control}
                  name="profile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perfil de Investidor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'none'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Não informado</SelectItem>
                          {INVESTOR_PROFILES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Converter
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
