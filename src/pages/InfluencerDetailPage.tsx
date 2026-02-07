import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useInfluencer } from '@/hooks/useInfluencers';
import { getMainPlatform, formatFollowers } from '@/hooks/useInfluencers';
import {
  useInfluencerCampaigns,
  useDeleteInfluencerCampaign,
  useInfluencerCampaignSummary,
  calculateCampaignROI,
} from '@/hooks/useInfluencerCampaigns';
import {
  useInfluencerNegotiations,
  useDeleteInfluencerNegotiation,
} from '@/hooks/useInfluencerNegotiations';
import { CampaignFormDialog } from '@/components/influencers/CampaignFormDialog';
import { NegotiationFormDialog } from '@/components/influencers/NegotiationFormDialog';
import {
  InfluencerCampaign,
  InfluencerNegotiation,
  INFLUENCER_ALL_STAGES,
  NICHE_OPTIONS,
  PROPOSED_MODEL_OPTIONS,
  CAMPAIGN_TYPE_OPTIONS,
  CAMPAIGN_STATUS_OPTIONS,
  INTERACTION_TYPE_OPTIONS,
  OUTCOME_OPTIONS,
} from '@/types/influencer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Instagram,
  Youtube,
  Twitter,
  Star,
  Users,
  DollarSign,
  TrendingUp,
  Target,
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function InfluencerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [campaignFormOpen, setCampaignFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<
    InfluencerCampaign | undefined
  >();
  const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null);

  const [negotiationFormOpen, setNegotiationFormOpen] = useState(false);
  const [editingNegotiation, setEditingNegotiation] = useState<
    InfluencerNegotiation | undefined
  >();
  const [deleteNegotiationId, setDeleteNegotiationId] = useState<string | null>(
    null
  );

  const { data: influencer, isLoading } = useInfluencer(id || '');
  const { data: campaigns, isLoading: campaignsLoading } =
    useInfluencerCampaigns(id || null);
  const { data: summary } = useInfluencerCampaignSummary(id || null);
  const { data: negotiations, isLoading: negotiationsLoading } =
    useInfluencerNegotiations(id || null);

  const deleteCampaign = useDeleteInfluencerCampaign();
  const deleteNegotiation = useDeleteInfluencerNegotiation();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const getStageConfig = (stage: string) =>
    INFLUENCER_ALL_STAGES.find((s) => s.id === stage) || {
      title: stage,
      color: 'bg-gray-500',
    };

  const getScoreColor = (score: number) => {
    if (score >= 70)
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 40)
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const getOutcomeBadge = (outcome: string | null) => {
    switch (outcome) {
      case 'positive':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Positivo
          </Badge>
        );
      case 'negative':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Negativo
          </Badge>
        );
      case 'neutral':
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            Neutro
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Pendente
          </Badge>
        );
      default:
        return null;
    }
  };

  const getCampaignStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Ativa
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Concluída
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Cancelada
          </Badge>
        );
      default:
        return <Badge variant="secondary">Planejada</Badge>;
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'dm':
        return <MessageSquare className="h-4 w-4" />;
      case 'proposal_sent':
        return <ArrowRight className="h-4 w-4" />;
      case 'contract_sent':
        return <ArrowRight className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const handleDeleteCampaign = async () => {
    if (!deleteCampaignId || !id) return;
    try {
      await deleteCampaign.mutateAsync({
        id: deleteCampaignId,
        influencerId: id,
      });
      toast.success('Campanha excluída com sucesso');
      setDeleteCampaignId(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir campanha');
    }
  };

  const handleDeleteNegotiation = async () => {
    if (!deleteNegotiationId || !id) return;
    try {
      await deleteNegotiation.mutateAsync({
        id: deleteNegotiationId,
        influencerId: id,
      });
      toast.success('Negociação excluída com sucesso');
      setDeleteNegotiationId(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir negociação');
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Detalhes do Influenciador">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </MainLayout>
    );
  }

  if (!influencer) {
    return (
      <MainLayout title="Influenciador não encontrado">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Influenciador não encontrado.
          </p>
          <Button
            className="mt-4"
            onClick={() => navigate('/influencers')}
          >
            Voltar para Pipeline
          </Button>
        </div>
      </MainLayout>
    );
  }

  const stageConfig = getStageConfig(influencer.stage);
  const score = Number(influencer.qualification_score) || 0;
  const mainPlatform = getMainPlatform(influencer);
  const totalFollowers =
    (influencer.instagram_followers || 0) +
    (influencer.youtube_subscribers || 0) +
    (influencer.twitter_followers || 0) +
    (influencer.tiktok_followers || 0);

  return (
    <MainLayout title={influencer.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/influencers')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <Megaphone className="h-6 w-6 text-purple-600" />
              <h1 className="text-2xl font-bold">{influencer.name}</h1>
              <Badge className={cn('text-xs', stageConfig.color, 'text-white')}>
                {stageConfig.title}
              </Badge>
              {score > 0 && (
                <Badge className={cn('gap-1', getScoreColor(score))}>
                  <Star className="h-3 w-3" />
                  Score: {score.toFixed(0)}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {influencer.email && <span>{influencer.email}</span>}
              {influencer.email && influencer.phone && <span> • </span>}
              {influencer.phone && <span>{influencer.phone}</span>}
              {influencer.source && (
                <>
                  <span> • </span>
                  <span>Fonte: {influencer.source}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Social Media Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Instagram</CardTitle>
              <Instagram className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {influencer.instagram_followers
                  ? formatFollowers(influencer.instagram_followers)
                  : '-'}
              </div>
              {influencer.instagram_handle && (
                <p className="text-xs text-muted-foreground truncate">
                  {influencer.instagram_handle}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">YouTube</CardTitle>
              <Youtube className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {influencer.youtube_subscribers
                  ? formatFollowers(influencer.youtube_subscribers)
                  : '-'}
              </div>
              {influencer.youtube_channel && (
                <p className="text-xs text-muted-foreground truncate">
                  {influencer.youtube_channel}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Twitter/X</CardTitle>
              <Twitter className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {influencer.twitter_followers
                  ? formatFollowers(influencer.twitter_followers)
                  : '-'}
              </div>
              {influencer.twitter_handle && (
                <p className="text-xs text-muted-foreground truncate">
                  {influencer.twitter_handle}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">TikTok</CardTitle>
              <span className="text-sm">🎵</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {influencer.tiktok_followers
                  ? formatFollowers(influencer.tiktok_followers)
                  : '-'}
              </div>
              {influencer.tiktok_handle && (
                <p className="text-xs text-muted-foreground truncate">
                  {influencer.tiktok_handle}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                Alcance Total
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatFollowers(totalFollowers)}
              </div>
              {influencer.engagement_rate && (
                <p className="text-xs text-muted-foreground">
                  {Number(influencer.engagement_rate).toFixed(1)}% engajamento
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ROI Summary */}
        {summary && summary.totalCampaigns > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">
                  Campanhas
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.totalCampaigns}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.activeCampaigns} ativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">
                  Leads Gerados
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalLeads}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalAccounts} contas abertas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">
                  Investimento
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.totalCost)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Budget: {formatCurrency(summary.totalBudget)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-green-800 dark:text-green-200">
                  ROI
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {summary.avgROI.toFixed(1)}x
                </div>
                <p className="text-xs text-muted-foreground">
                  Receita: {formatCurrency(summary.totalRevenue)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Niches & Profile Info */}
        {(influencer.niche?.length || influencer.audience_profile || influencer.content_style || influencer.proposed_model) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {influencer.niche && influencer.niche.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Nichos
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {influencer.niche.map((n) => (
                        <Badge key={n} variant="outline">
                          {NICHE_OPTIONS.find((o) => o.value === n)?.label || n}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {influencer.proposed_model && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Modelo de Negócio
                    </p>
                    <Badge>
                      {PROPOSED_MODEL_OPTIONS.find(
                        (o) => o.value === influencer.proposed_model
                      )?.label || influencer.proposed_model}
                    </Badge>
                    {influencer.proposed_commission && (
                      <span className="ml-2 text-sm">
                        {Number(influencer.proposed_commission)}% comissão
                      </span>
                    )}
                    {influencer.monthly_cost_estimate && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({formatCurrency(Number(influencer.monthly_cost_estimate))}/mês)
                      </span>
                    )}
                  </div>
                )}
                {influencer.audience_profile && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Perfil do Público
                    </p>
                    <p className="text-sm">{influencer.audience_profile}</p>
                  </div>
                )}
                {influencer.content_style && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Estilo de Conteúdo
                    </p>
                    <p className="text-sm">{influencer.content_style}</p>
                  </div>
                )}
              </div>
              {influencer.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Observações
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {influencer.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList>
            <TabsTrigger value="campaigns">
              <Megaphone className="h-4 w-4 mr-2" />
              Campanhas ({campaigns?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="negotiations">
              <MessageSquare className="h-4 w-4 mr-2" />
              Negociações ({negotiations?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Campanhas</CardTitle>
                  <Button
                    onClick={() => {
                      setEditingCampaign(undefined);
                      setCampaignFormOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Campanha
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {campaignsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : !campaigns?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma campanha registrada para este influenciador
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campanha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Custo</TableHead>
                          <TableHead className="text-center">Leads</TableHead>
                          <TableHead className="text-right">Receita</TableHead>
                          <TableHead className="text-right">ROI</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaigns.map((campaign) => {
                          const roi = calculateCampaignROI(campaign);
                          return (
                            <TableRow key={campaign.id}>
                              <TableCell>
                                <div>
                                  <span className="font-medium">
                                    {campaign.name}
                                  </span>
                                  {campaign.tracking_code && (
                                    <span className="block text-xs text-muted-foreground">
                                      {campaign.tracking_code}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {CAMPAIGN_TYPE_OPTIONS.find(
                                    (o) => o.value === campaign.campaign_type
                                  )?.label || campaign.campaign_type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {getCampaignStatusBadge(campaign.status)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {campaign.actual_cost
                                  ? formatCurrency(
                                      Number(campaign.actual_cost)
                                    )
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                {campaign.leads_generated || 0}
                              </TableCell>
                              <TableCell className="text-right font-mono font-medium text-primary">
                                {Number(campaign.revenue_generated) > 0
                                  ? formatCurrency(
                                      Number(campaign.revenue_generated)
                                    )
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                {roi > 0 ? (
                                  <Badge
                                    className={
                                      roi >= 1
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    }
                                  >
                                    {roi.toFixed(1)}x
                                  </Badge>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setEditingCampaign(campaign);
                                      setCampaignFormOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      setDeleteCampaignId(campaign.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Negotiations Tab */}
          <TabsContent value="negotiations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    Timeline de Negociações
                  </CardTitle>
                  <Button
                    onClick={() => {
                      setEditingNegotiation(undefined);
                      setNegotiationFormOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Interação
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {negotiationsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : !negotiations?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma negociação registrada para este influenciador
                  </div>
                ) : (
                  <div className="space-y-4">
                    {negotiations.map((negotiation) => (
                      <div
                        key={negotiation.id}
                        className="flex gap-4 p-4 rounded-lg border bg-card"
                      >
                        <div className="flex-shrink-0 mt-1 text-muted-foreground">
                          {getInteractionIcon(negotiation.interaction_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {INTERACTION_TYPE_OPTIONS.find(
                                (o) =>
                                  o.value === negotiation.interaction_type
                              )?.label || negotiation.interaction_type}
                            </Badge>
                            {getOutcomeBadge(negotiation.outcome)}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {format(
                                new Date(negotiation.created_at),
                                "dd/MM/yyyy 'às' HH:mm",
                                { locale: ptBR }
                              )}
                            </span>
                          </div>
                          <p className="mt-2 text-sm whitespace-pre-wrap">
                            {negotiation.description}
                          </p>
                          {negotiation.next_action && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Próxima ação: {negotiation.next_action}
                              </span>
                              {negotiation.next_action_date && (
                                <span>
                                  (
                                  {format(
                                    new Date(
                                      negotiation.next_action_date + 'T00:00:00'
                                    ),
                                    'dd/MM/yyyy'
                                  )}
                                  )
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-start gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingNegotiation(negotiation);
                              setNegotiationFormOpen(true);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              setDeleteNegotiationId(negotiation.id)
                            }
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Campaign Form Dialog */}
        {id && (
          <CampaignFormDialog
            open={campaignFormOpen}
            onOpenChange={(open) => {
              setCampaignFormOpen(open);
              if (!open) setEditingCampaign(undefined);
            }}
            influencerId={id}
            campaign={editingCampaign}
          />
        )}

        {/* Negotiation Form Dialog */}
        {id && (
          <NegotiationFormDialog
            open={negotiationFormOpen}
            onOpenChange={(open) => {
              setNegotiationFormOpen(open);
              if (!open) setEditingNegotiation(undefined);
            }}
            influencerId={id}
            negotiation={editingNegotiation}
          />
        )}

        {/* Delete Campaign Confirmation */}
        <AlertDialog
          open={!!deleteCampaignId}
          onOpenChange={() => setDeleteCampaignId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta campanha? Esta ação não pode
                ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCampaign}
                className="bg-destructive text-destructive-foreground"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Negotiation Confirmation */}
        <AlertDialog
          open={!!deleteNegotiationId}
          onOpenChange={() => setDeleteNegotiationId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta negociação? Esta ação não
                pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteNegotiation}
                className="bg-destructive text-destructive-foreground"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
