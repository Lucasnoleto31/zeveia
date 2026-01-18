import { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateClient, useUpdateClient } from '@/hooks/useClients';
import { useOrigins, useCampaigns } from '@/hooks/useConfiguration';
import { usePartners } from '@/hooks/usePartners';
import { useAuth } from '@/contexts/AuthContext';
import { Client, ClientType } from '@/types/database';
import { toast } from 'sonner';
import { Loader2, User, Building2 } from 'lucide-react';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const baseSchema = {
  account_number: z.string().trim().max(50).optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  email: z.string().trim().email('E-mail inválido').max(255).optional().or(z.literal('')),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  patrimony: z.string().optional().or(z.literal('')),
  profile: z.enum(['conservador', 'moderado', 'arrojado', 'agressivo']).optional(),
  origin_id: z.string().optional().or(z.literal('')),
  campaign_id: z.string().optional().or(z.literal('')),
  partner_id: z.string().optional().or(z.literal('')),
  observations: z.string().trim().max(1000).optional().or(z.literal('')),
};

const pfSchema = z.object({
  type: z.literal('pf'),
  name: z.string().trim().min(2, 'Nome obrigatório').max(100),
  cpf: z.string().trim().max(14).optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  sex: z.enum(['masculino', 'feminino', 'outro']).optional(),
  marital_status: z.enum(['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel']).optional(),
  ...baseSchema,
});

const pjSchema = z.object({
  type: z.literal('pj'),
  company_name: z.string().trim().min(2, 'Razão social obrigatória').max(200),
  trade_name: z.string().trim().max(200).optional().or(z.literal('')),
  cnpj: z.string().trim().max(18).optional().or(z.literal('')),
  responsible_name: z.string().trim().max(100).optional().or(z.literal('')),
  responsible_cpf: z.string().trim().max(14).optional().or(z.literal('')),
  responsible_birth_date: z.string().optional().or(z.literal('')),
  responsible_position: z.string().trim().max(50).optional().or(z.literal('')),
  ...baseSchema,
});

type PFFormData = z.infer<typeof pfSchema>;
type PJFormData = z.infer<typeof pjSchema>;

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  defaultType?: ClientType;
}

export function ClientFormDialog({ open, onOpenChange, client, defaultType = 'pf' }: ClientFormDialogProps) {
  const { user } = useAuth();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const { data: origins } = useOrigins();
  const { data: campaigns } = useCampaigns();
  const { data: partners } = usePartners({ active: true });

  const [clientType, setClientType] = useState<ClientType>(defaultType);
  const isEditing = !!client;

  useEffect(() => {
    if (client) {
      setClientType(client.type);
    } else {
      setClientType(defaultType);
    }
  }, [client, defaultType]);

  const pfForm = useForm<PFFormData>({
    resolver: zodResolver(pfSchema),
    defaultValues: {
      type: 'pf',
      name: '',
      cpf: '',
      birth_date: '',
      sex: undefined,
      marital_status: undefined,
      account_number: '',
      state: '',
      email: '',
      phone: '',
      patrimony: '',
      profile: undefined,
      origin_id: '',
      campaign_id: '',
      partner_id: '',
      observations: '',
    },
  });

  const pjForm = useForm<PJFormData>({
    resolver: zodResolver(pjSchema),
    defaultValues: {
      type: 'pj',
      company_name: '',
      trade_name: '',
      cnpj: '',
      responsible_name: '',
      responsible_cpf: '',
      responsible_birth_date: '',
      responsible_position: '',
      account_number: '',
      state: '',
      email: '',
      phone: '',
      patrimony: '',
      profile: undefined,
      origin_id: '',
      campaign_id: '',
      partner_id: '',
      observations: '',
    },
  });

  useEffect(() => {
    if (client) {
      if (client.type === 'pf') {
        pfForm.reset({
          type: 'pf',
          name: client.name || '',
          cpf: client.cpf || '',
          birth_date: client.birth_date || '',
          sex: client.sex || undefined,
          marital_status: client.marital_status || undefined,
          account_number: client.account_number || '',
          state: client.state || '',
          email: client.email || '',
          phone: client.phone || '',
          patrimony: client.patrimony?.toString() || '',
          profile: client.profile || undefined,
          origin_id: client.origin_id || '',
          campaign_id: client.campaign_id || '',
          partner_id: client.partner_id || '',
          observations: client.observations || '',
        });
      } else {
        pjForm.reset({
          type: 'pj',
          company_name: client.company_name || '',
          trade_name: client.trade_name || '',
          cnpj: client.cnpj || '',
          responsible_name: client.responsible_name || '',
          responsible_cpf: client.responsible_cpf || '',
          responsible_birth_date: client.responsible_birth_date || '',
          responsible_position: client.responsible_position || '',
          account_number: client.account_number || '',
          state: client.state || '',
          email: client.email || '',
          phone: client.phone || '',
          patrimony: client.patrimony?.toString() || '',
          profile: client.profile || undefined,
          origin_id: client.origin_id || '',
          campaign_id: client.campaign_id || '',
          partner_id: client.partner_id || '',
          observations: client.observations || '',
        });
      }
    } else {
      pfForm.reset();
      pjForm.reset();
    }
  }, [client, pfForm, pjForm]);

  const onSubmitPF = async (data: PFFormData) => {
    await handleSubmit(data);
  };

  const onSubmitPJ = async (data: PJFormData) => {
    await handleSubmit(data);
  };

  const handleSubmit = async (data: PFFormData | PJFormData) => {
    try {
      const clientData: any = {
        type: data.type,
        account_number: data.account_number || null,
        state: data.state || null,
        email: data.email || null,
        phone: data.phone || null,
        patrimony: data.patrimony ? parseFloat(data.patrimony) : null,
        profile: data.profile || null,
        origin_id: data.origin_id || null,
        campaign_id: data.campaign_id || null,
        partner_id: data.partner_id || null,
        observations: data.observations || null,
        assessor_id: client?.assessor_id || user!.id,
        updated_by: user!.id,
        active: true,
      };

      if (data.type === 'pf') {
        const pfData = data as PFFormData;
        clientData.name = pfData.name;
        clientData.cpf = pfData.cpf || null;
        clientData.birth_date = pfData.birth_date || null;
        clientData.sex = pfData.sex || null;
        clientData.marital_status = pfData.marital_status || null;
      } else {
        const pjData = data as PJFormData;
        clientData.name = pjData.company_name;
        clientData.company_name = pjData.company_name;
        clientData.trade_name = pjData.trade_name || null;
        clientData.cnpj = pjData.cnpj || null;
        clientData.responsible_name = pjData.responsible_name || null;
        clientData.responsible_cpf = pjData.responsible_cpf || null;
        clientData.responsible_birth_date = pjData.responsible_birth_date || null;
        clientData.responsible_position = pjData.responsible_position || null;
      }

      if (isEditing) {
        await updateClient.mutateAsync({ id: client.id, ...clientData });
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await createClient.mutateAsync(clientData);
        toast.success('Cliente criado com sucesso!');
      }

      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar cliente');
    }
  };

  const isLoading = createClient.isPending || updateClient.isPending;

  const renderCommonFields = (form: any) => (
    <>
      {/* Account & State */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
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
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BRAZILIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-2 gap-4">
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
                <Input placeholder="(11) 99999-9999" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Patrimony & Profile */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="patrimony"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patrimônio (R$)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="profile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Perfil de Investidor</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="conservador">Conservador</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="arrojado">Arrojado</SelectItem>
                  <SelectItem value="agressivo">Agressivo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Origin & Campaign */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="origin_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Origem</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {origins?.filter(o => o.active).map((origin) => (
                    <SelectItem key={origin.id} value={origin.id}>
                      {origin.name}
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
          name="campaign_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campanha</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
      </div>

      {/* Partner */}
      <FormField
        control={form.control}
        name="partner_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Parceiro</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {partners?.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Observations */}
      <FormField
        control={form.control}
        name="observations"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Observações</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Notas sobre o cliente..."
                className="resize-none"
                rows={2}
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as informações do cliente' 
              : 'Preencha os dados para criar um novo cliente'}
          </DialogDescription>
        </DialogHeader>

        {!isEditing && (
          <Tabs value={clientType} onValueChange={(v) => setClientType(v as ClientType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pf" className="gap-2">
                <User className="h-4 w-4" />
                Pessoa Física
              </TabsTrigger>
              <TabsTrigger value="pj" className="gap-2">
                <Building2 className="h-4 w-4" />
                Pessoa Jurídica
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {clientType === 'pf' ? (
          <Form {...pfForm}>
            <form onSubmit={pfForm.handleSubmit(onSubmitPF)} className="space-y-4">
              {/* PF Specific Fields */}
              <FormField
                control={pfForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={pfForm.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pfForm.control}
                  name="birth_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={pfForm.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sexo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pfForm.control}
                  name="marital_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Civil</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                          <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                          <SelectItem value="uniao_estavel">União Estável</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {renderCommonFields(pfForm)}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? 'Salvar' : 'Criar Cliente'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...pjForm}>
            <form onSubmit={pjForm.handleSubmit(onSubmitPJ)} className="space-y-4">
              {/* PJ Specific Fields */}
              <FormField
                control={pjForm.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social *</FormLabel>
                    <FormControl>
                      <Input placeholder="Razão social da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
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
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Responsible */}
              <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-medium text-sm">Responsável</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={pjForm.control}
                    name="responsible_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do responsável" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={pjForm.control}
                    name="responsible_cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={pjForm.control}
                    name="responsible_birth_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={pjForm.control}
                    name="responsible_position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Diretor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {renderCommonFields(pjForm)}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? 'Salvar' : 'Criar Cliente'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
