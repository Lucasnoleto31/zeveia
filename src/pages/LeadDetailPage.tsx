import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Pencil, 
  Plus, 
  UserCheck, 
  XCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  PhoneCall,
  Video,
  FileText,
  Users,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Circle,
  Handshake,
  Trash2
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useLead, useLeadMetrics, useUpdateLead, useDeleteLead } from '@/hooks/useLeads';
import { useProfiles } from '@/hooks/useProfiles';
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
import { LeadFormDialog } from '@/components/leads/LeadFormDialog';
import { InteractionFormDialog } from '@/components/clients/InteractionFormDialog';
import { ConvertToClientDialog } from '@/components/leads/ConvertToClientDialog';
import { MarkAsLostDialog } from '@/components/leads/MarkAsLostDialog';
import { LeadStatus } from '@/types/database';
import { INTERACTION_TYPES } from '@/hooks/useInteractions';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; icon: React.ReactNode }> = {
  novo: { label: 'Novo', color: 'bg-blue-500', icon: <Circle className="h-4 w-4" /> },
  em_contato: { label: 'Em Contato', color: 'bg-yellow-500', icon: <Phone className="h-4 w-4" /> },
  troca_assessoria: { label: 'Troca de Assessoria', color: 'bg-purple-500', icon: <Users className="h-4 w-4" /> },
  convertido: { label: 'Convertido', color: 'bg-green-500', icon: <CheckCircle2 className="h-4 w-4" /> },
  perdido: { label: 'Perdido', color: 'bg-red-500', icon: <XCircle className="h-4 w-4" /> },
};

const PIPELINE_STAGES: LeadStatus[] = ['novo', 'em_contato', 'troca_assessoria', 'convertido'];

function getDaysWithoutContactColor(days: number | null): string {
  if (days === null) return 'text-muted-foreground';
  if (days <= 3) return 'text-green-600';
  if (days <= 7) return 'text-yellow-600';
  if (days <= 14) return 'text-orange-600';
  return 'text-red-600';
}

function getDaysWithoutContactLabel(days: number | null): string {
  if (days === null) return 'Sem interações';
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  return `${days} dias`;
}

function getInteractionIcon(type: string) {
  const found = INTERACTION_TYPES.find(t => t.value === type);
  if (found) {
    const icons: Record<string, React.ReactNode> = {
      ligacao: <PhoneCall className="h-4 w-4" />,
      whatsapp: <MessageSquare className="h-4 w-4" />,
      email: <Mail className="h-4 w-4" />,
      reuniao: <Video className="h-4 w-4" />,
      nota: <FileText className="h-4 w-4" />,
    };
    return icons[type] || <MessageSquare className="h-4 w-4" />;
  }
  return <MessageSquare className="h-4 w-4" />;
}

function getInteractionLabel(type: string) {
  const found = INTERACTION_TYPES.find(t => t.value === type);
  return found?.label || type;
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lead, isLoading: leadLoading } = useLead(id || '');
  const { data: metrics, isLoading: metricsLoading } = useLeadMetrics(id || '');
  const { data: profiles } = useProfiles();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  
  const assessorName = lead ? profiles?.find(p => p.user_id === lead.assessor_id)?.name || 'Não definido' : '';

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteLead = async () => {
    try {
      await deleteLead.mutateAsync(lead!.id);
      toast.success('Lead excluído com sucesso');
      navigate('/leads');
    } catch (error) {
      toast.error('Erro ao excluir lead');
    }
  };

  if (leadLoading || metricsLoading) {
    return (
      <MainLayout title="Carregando...">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!lead) {
    return (
      <MainLayout title="Lead não encontrado">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Lead não encontrado</p>
          <Button onClick={() => navigate('/leads')}>Voltar para Leads</Button>
        </div>
      </MainLayout>
    );
  }

  const statusConfig = STATUS_CONFIG[lead.status];
  const isFinalized = lead.status === 'convertido' || lead.status === 'perdido';
  const daysInPipeline = differenceInDays(
    lead.converted_at ? new Date(lead.converted_at) : new Date(),
    new Date(lead.created_at)
  );
  const currentStageIndex = PIPELINE_STAGES.indexOf(lead.status);

  const handleChangeStatus = async (newStatus: LeadStatus) => {
    try {
      await updateLead.mutateAsync({ id: lead.id, status: newStatus });
      toast.success(`Status alterado para ${STATUS_CONFIG[newStatus].label}`);
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  return (
    <MainLayout
      title={
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{lead.name}</h1>
            <p className="text-sm text-muted-foreground">
              Lead criado há {formatDistanceToNow(new Date(lead.created_at), { locale: ptBR })}
            </p>
          </div>
          <Badge className={`${statusConfig.color} text-white ml-2`}>
            {statusConfig.icon}
            <span className="ml-1">{statusConfig.label}</span>
          </Badge>
        </div>
      }
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setInteractionDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Interação
          </Button>
          {!isFinalized && (
            <>
              <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button onClick={() => setConvertDialogOpen(true)}>
                <UserCheck className="h-4 w-4 mr-2" />
                Converter para Cliente
              </Button>
            </>
          )}
          <Button 
            variant="destructive" 
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
            title="Excluir Lead"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{daysInPipeline}</p>
                  <p className="text-xs text-muted-foreground">Dias no Pipeline</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{metrics?.totalInteractions || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Interações</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {metrics?.lastInteraction 
                      ? format(new Date(metrics.lastInteraction.created_at), 'dd/MM/yyyy', { locale: ptBR })
                      : '-'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Última Interação</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className={`h-5 w-5 ${getDaysWithoutContactColor(metrics?.daysSinceLastInteraction ?? null)}`} />
                <div>
                  <p className={`text-2xl font-bold ${getDaysWithoutContactColor(metrics?.daysSinceLastInteraction ?? null)}`}>
                    {getDaysWithoutContactLabel(metrics?.daysSinceLastInteraction ?? null)}
                  </p>
                  <p className="text-xs text-muted-foreground">Sem Contato</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <Badge className={`${statusConfig.color} text-white`}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Status Atual</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cadastral Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados Cadastrais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{lead.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {lead.state || '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {lead.email || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {lead.phone || '-'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Origem</p>
                  <p className="font-medium">{lead.origin?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Campanha</p>
                  <p className="font-medium">{lead.campaign?.name || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Parceiro</p>
                  {lead.partner ? (
                    <Link to={`/partners/${lead.partner.id}`} className="font-medium text-primary hover:underline flex items-center gap-1">
                      <Handshake className="h-4 w-4" />
                      {lead.partner.name}
                    </Link>
                  ) : (
                    <p className="font-medium">-</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assessor Responsável</p>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {assessorName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="font-medium">
                    {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {lead.status === 'convertido' && lead.converted_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Convertido em</p>
                  <p className="font-medium text-green-600">
                    {format(new Date(lead.converted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}

              {lead.status === 'perdido' && lead.loss_reason && (
                <div>
                  <p className="text-sm text-muted-foreground">Motivo da Perda</p>
                  <Badge variant="destructive">{lead.loss_reason.name}</Badge>
                </div>
              )}

              {lead.observations && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-sm mt-1 p-2 bg-muted rounded-md">{lead.observations}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Journey */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Jornada no Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {PIPELINE_STAGES.map((stage, index) => {
                  const config = STATUS_CONFIG[stage];
                  const isCurrentStage = lead.status === stage;
                  const isPassed = currentStageIndex > index || lead.status === 'convertido';
                  const isLost = lead.status === 'perdido';

                  return (
                    <div key={stage} className="flex items-center gap-4">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${isCurrentStage ? config.color + ' text-white' : ''}
                        ${isPassed && !isCurrentStage ? 'bg-green-100 text-green-600' : ''}
                        ${!isPassed && !isCurrentStage ? 'bg-muted text-muted-foreground' : ''}
                        ${isLost && !isPassed ? 'bg-red-100 text-red-600' : ''}
                      `}>
                        {isPassed && !isCurrentStage ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          config.icon
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isCurrentStage ? '' : 'text-muted-foreground'}`}>
                          {config.label}
                        </p>
                        {isCurrentStage && (
                          <p className="text-xs text-muted-foreground">Etapa atual</p>
                        )}
                      </div>
                      {index < PIPELINE_STAGES.length - 1 && (
                        <div className={`w-px h-8 ${isPassed ? 'bg-green-300' : 'bg-muted'}`} />
                      )}
                    </div>
                  );
                })}

                {lead.status === 'perdido' && (
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                    <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center">
                      <XCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-red-600">Perdido</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.loss_reason?.name || 'Motivo não informado'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tempo total no pipeline:</span>
                <span className="font-bold">{daysInPipeline} dias</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactions Timeline */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Timeline de Interações</CardTitle>
            <Button size="sm" onClick={() => setInteractionDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Interação
            </Button>
          </CardHeader>
          <CardContent>
            {metrics?.interactions && metrics.interactions.length > 0 ? (
              <div className="space-y-4">
                {metrics.interactions.map((interaction, index) => (
                  <div key={interaction.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        {getInteractionIcon(interaction.type)}
                      </div>
                      {index < metrics.interactions.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{getInteractionLabel(interaction.type)}</p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(interaction.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">por {interaction.userName}</p>
                      <p className="text-sm mt-2 p-3 bg-muted rounded-md">{interaction.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma interação registrada</p>
                <Button variant="link" onClick={() => setInteractionDialogOpen(true)}>
                  Registrar primeira interação
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {!isFinalized && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {lead.status === 'novo' && (
                  <Button variant="outline" onClick={() => handleChangeStatus('em_contato')}>
                    <Phone className="h-4 w-4 mr-2" />
                    Marcar como Em Contato
                  </Button>
                )}
                {lead.status === 'em_contato' && (
                  <Button variant="outline" onClick={() => handleChangeStatus('troca_assessoria')}>
                    <Users className="h-4 w-4 mr-2" />
                    Marcar como Troca de Assessoria
                  </Button>
                )}
                <Button variant="destructive" onClick={() => setLostDialogOpen(true)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Marcar como Perdido
                </Button>
                <Button onClick={() => setConvertDialogOpen(true)}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Converter para Cliente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <LeadFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        lead={lead}
      />

      <InteractionFormDialog
        open={interactionDialogOpen}
        onOpenChange={setInteractionDialogOpen}
        leadId={lead.id}
      />

      <ConvertToClientDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        lead={lead}
      />

      <MarkAsLostDialog
        open={lostDialogOpen}
        onOpenChange={setLostDialogOpen}
        lead={lead}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead "{lead.name}"? 
              Esta ação é irreversível e todas as interações associadas também serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
