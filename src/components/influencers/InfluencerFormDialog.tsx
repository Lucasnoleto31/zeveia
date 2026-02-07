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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateInfluencer, useUpdateInfluencer } from '@/hooks/useInfluencers';
import {
  InfluencerProfile,
  INFLUENCER_ALL_STAGES,
  NICHE_OPTIONS,
  PROPOSED_MODEL_OPTIONS,
} from '@/types/influencer';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const influencerSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  email: z.string().trim().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().trim().max(20, 'Telefone muito longo').optional().or(z.literal('')),
  stage: z.string().min(1, 'Estágio é obrigatório'),
  source: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  // Social media
  instagram_handle: z.string().optional().or(z.literal('')),
  instagram_followers: z.coerce.number().min(0).optional(),
  youtube_channel: z.string().optional().or(z.literal('')),
  youtube_subscribers: z.coerce.number().min(0).optional(),
  twitter_handle: z.string().optional().or(z.literal('')),
  twitter_followers: z.coerce.number().min(0).optional(),
  tiktok_handle: z.string().optional().or(z.literal('')),
  tiktok_followers: z.coerce.number().min(0).optional(),
  // Profile
  niche: z.array(z.string()).optional(),
  audience_profile: z.string().optional().or(z.literal('')),
  content_style: z.string().optional().or(z.literal('')),
  engagement_rate: z.coerce.number().min(0).max(100).optional(),
  // Qualification
  estimated_reach: z.coerce.number().min(0).optional(),
  estimated_cpl: z.coerce.number().min(0).optional(),
  // Business
  proposed_commission: z.coerce.number().min(0).max(100).optional(),
  proposed_model: z.string().optional().or(z.literal('')),
  monthly_cost_estimate: z.coerce.number().min(0).optional(),
});

type InfluencerFormData = z.infer<typeof influencerSchema>;

interface InfluencerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  influencer?: InfluencerProfile;
}

export function InfluencerFormDialog({
  open,
  onOpenChange,
  influencer,
}: InfluencerFormDialogProps) {
  const createInfluencer = useCreateInfluencer();
  const updateInfluencer = useUpdateInfluencer();

  const form = useForm<InfluencerFormData>({
    resolver: zodResolver(influencerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      stage: 'identified',
      source: '',
      notes: '',
      instagram_handle: '',
      instagram_followers: 0,
      youtube_channel: '',
      youtube_subscribers: 0,
      twitter_handle: '',
      twitter_followers: 0,
      tiktok_handle: '',
      tiktok_followers: 0,
      niche: [],
      audience_profile: '',
      content_style: '',
      engagement_rate: 0,
      estimated_reach: 0,
      estimated_cpl: 0,
      proposed_commission: 0,
      proposed_model: '',
      monthly_cost_estimate: 0,
    },
  });

  useEffect(() => {
    if (influencer) {
      form.reset({
        name: influencer.name,
        email: influencer.email || '',
        phone: influencer.phone || '',
        stage: influencer.stage,
        source: influencer.source || '',
        notes: influencer.notes || '',
        instagram_handle: influencer.instagram_handle || '',
        instagram_followers: influencer.instagram_followers || 0,
        youtube_channel: influencer.youtube_channel || '',
        youtube_subscribers: influencer.youtube_subscribers || 0,
        twitter_handle: influencer.twitter_handle || '',
        twitter_followers: influencer.twitter_followers || 0,
        tiktok_handle: influencer.tiktok_handle || '',
        tiktok_followers: influencer.tiktok_followers || 0,
        niche: influencer.niche || [],
        audience_profile: influencer.audience_profile || '',
        content_style: influencer.content_style || '',
        engagement_rate: Number(influencer.engagement_rate) || 0,
        estimated_reach: influencer.estimated_reach || 0,
        estimated_cpl: Number(influencer.estimated_cpl) || 0,
        proposed_commission: Number(influencer.proposed_commission) || 0,
        proposed_model: influencer.proposed_model || '',
        monthly_cost_estimate: Number(influencer.monthly_cost_estimate) || 0,
      });
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        stage: 'identified',
        source: '',
        notes: '',
        instagram_handle: '',
        instagram_followers: 0,
        youtube_channel: '',
        youtube_subscribers: 0,
        twitter_handle: '',
        twitter_followers: 0,
        tiktok_handle: '',
        tiktok_followers: 0,
        niche: [],
        audience_profile: '',
        content_style: '',
        engagement_rate: 0,
        estimated_reach: 0,
        estimated_cpl: 0,
        proposed_commission: 0,
        proposed_model: '',
        monthly_cost_estimate: 0,
      });
    }
  }, [influencer, form, open]);

  const onSubmit = async (data: InfluencerFormData) => {
    try {
      const payload: any = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        stage: data.stage,
        source: data.source || null,
        notes: data.notes || null,
        instagram_handle: data.instagram_handle || null,
        instagram_followers: data.instagram_followers || null,
        youtube_channel: data.youtube_channel || null,
        youtube_subscribers: data.youtube_subscribers || null,
        twitter_handle: data.twitter_handle || null,
        twitter_followers: data.twitter_followers || null,
        tiktok_handle: data.tiktok_handle || null,
        tiktok_followers: data.tiktok_followers || null,
        niche: data.niche && data.niche.length > 0 ? data.niche : null,
        audience_profile: data.audience_profile || null,
        content_style: data.content_style || null,
        engagement_rate: data.engagement_rate || null,
        estimated_reach: data.estimated_reach || null,
        estimated_cpl: data.estimated_cpl || null,
        proposed_commission: data.proposed_commission || null,
        proposed_model: data.proposed_model || null,
        monthly_cost_estimate: data.monthly_cost_estimate || null,
      };

      if (influencer) {
        await updateInfluencer.mutateAsync({ id: influencer.id, ...payload });
        toast.success('Influenciador atualizado com sucesso');
      } else {
        await createInfluencer.mutateAsync(payload);
        toast.success('Influenciador criado com sucesso');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar influenciador');
    }
  };

  const isSubmitting = createInfluencer.isPending || updateInfluencer.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {influencer ? 'Editar Influenciador' : 'Novo Influenciador'}
          </DialogTitle>
          <DialogDescription>
            {influencer
              ? 'Atualize os dados do influenciador'
              : 'Cadastre um novo influenciador no pipeline de prospecção'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="social">Redes Sociais</TabsTrigger>
                <TabsTrigger value="qualification">Qualificação</TabsTrigger>
                <TabsTrigger value="business">Negócio</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do influenciador" {...field} />
                      </FormControl>
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
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estágio</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estágio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INFLUENCER_ALL_STAGES.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.title}
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
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fonte</FormLabel>
                      <FormControl>
                        <Input placeholder="Como encontramos este influenciador" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="niche"
                  render={() => (
                    <FormItem>
                      <FormLabel>Nichos</FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {NICHE_OPTIONS.map((option) => (
                          <FormField
                            key={option.value}
                            control={form.control}
                            name="niche"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(option.value)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, option.value]);
                                      } else {
                                        field.onChange(
                                          current.filter((v) => v !== option.value)
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal cursor-pointer">
                                  {option.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notas sobre o influenciador..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Social Media Tab */}
              <TabsContent value="social" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="instagram_handle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram @</FormLabel>
                        <FormControl>
                          <Input placeholder="@usuario" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="instagram_followers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seguidores Instagram</FormLabel>
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
                    name="youtube_channel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Canal YouTube</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do canal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="youtube_subscribers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inscritos YouTube</FormLabel>
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
                    name="twitter_handle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter/X @</FormLabel>
                        <FormControl>
                          <Input placeholder="@usuario" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="twitter_followers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seguidores Twitter</FormLabel>
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
                    name="tiktok_handle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TikTok @</FormLabel>
                        <FormControl>
                          <Input placeholder="@usuario" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tiktok_followers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seguidores TikTok</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Qualification Tab */}
              <TabsContent value="qualification" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="engagement_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa de Engajamento (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Média de engajamento nas publicações
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimated_reach"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alcance Estimado</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Número estimado de pessoas alcançadas por publicação
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimated_cpl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPL Estimado (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Custo por lead estimado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="audience_profile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perfil do Público</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição do público-alvo do influenciador..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content_style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estilo de Conteúdo</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Como o influenciador produz e apresenta conteúdo..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Business Terms Tab */}
              <TabsContent value="business" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="proposed_model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo Proposto</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o modelo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROPOSED_MODEL_OPTIONS.map((opt) => (
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
                  name="proposed_commission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comissão Proposta (%)</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthly_cost_estimate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo Mensal Estimado (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Estimativa de custo mensal para manter a parceria
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {influencer ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
