import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientOpportunities, ClientOpportunity } from '@/hooks/useClientOpportunities';
import { 
  Target, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight,
  Sparkles,
  Package,
  Calendar,
  Megaphone,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface OpportunitiesHistoryProps {
  clientId: string;
  onCreateOpportunity?: () => void;
}

function getStatusConfig(status: string, isOriginalLead: boolean) {
  if (status === 'convertido') {
    return {
      label: isOriginalLead ? 'Tornou-se Cliente' : 'Convertido',
      icon: CheckCircle2,
      variant: 'default' as const,
      className: 'bg-emerald-500 hover:bg-emerald-600',
      textClass: 'text-emerald-600',
    };
  }
  if (status === 'perdido') {
    return {
      label: 'Perdido',
      icon: XCircle,
      variant: 'destructive' as const,
      className: '',
      textClass: 'text-destructive',
    };
  }
  return {
    label: status === 'novo' ? 'Novo' : status === 'em_contato' ? 'Em Contato' : status === 'troca_assessoria' ? 'Troca de Assessoria' : status,
    icon: Clock,
    variant: 'secondary' as const,
    className: '',
    textClass: 'text-primary',
  };
}

function OpportunityCard({ opportunity }: { opportunity: ClientOpportunity }) {
  const statusConfig = getStatusConfig(opportunity.status, opportunity.is_original_lead);
  const StatusIcon = statusConfig.icon;
  const isActive = !['convertido', 'perdido'].includes(opportunity.status);

  return (
    <div 
      className={`relative p-4 rounded-lg border transition-colors ${
        isActive ? 'bg-primary/5 border-primary/30' : 'bg-muted/30'
      }`}
    >
      {/* Timeline connector */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-gradient-to-b from-primary/50 to-primary/10" />
      
      <div className="pl-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {opportunity.is_original_lead ? (
              <Sparkles className="h-4 w-4 text-amber-500" />
            ) : (
              <Target className="h-4 w-4 text-primary" />
            )}
            <span className="font-medium text-sm">
              {opportunity.is_original_lead ? 'Lead Original' : 'Oportunidade'}
            </span>
          </div>
          <Badge 
            variant={statusConfig.variant} 
            className={`gap-1 ${statusConfig.className}`}
          >
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(opportunity.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </span>
            
            {opportunity.target_product && (
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {opportunity.target_product.name}
              </span>
            )}
            
            {opportunity.campaign && (
              <span className="flex items-center gap-1">
                <Megaphone className="h-3 w-3" />
                {opportunity.campaign.name}
              </span>
            )}
          </div>

          {/* Conversion info */}
          {opportunity.status === 'convertido' && opportunity.converted_at && (
            <div className={`flex items-center gap-2 ${statusConfig.textClass}`}>
              <ArrowRight className="h-3 w-3" />
              <span>
                {opportunity.is_original_lead 
                  ? `Cliente desde ${format(new Date(opportunity.converted_at), "dd/MM/yyyy", { locale: ptBR })}`
                  : `Convertido em ${format(new Date(opportunity.converted_at), "dd/MM/yyyy", { locale: ptBR })}`
                }
              </span>
            </div>
          )}

          {/* Loss reason */}
          {opportunity.status === 'perdido' && opportunity.loss_reason && (
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-3 w-3" />
              <span>Motivo: {opportunity.loss_reason.name}</span>
            </div>
          )}

          {/* Observations */}
          {opportunity.observations && (
            <p className="text-muted-foreground italic">
              "{opportunity.observations}"
            </p>
          )}
        </div>

        {/* Link to lead if active */}
        {isActive && (
          <div className="mt-3">
            <Link to={`/leads/${opportunity.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                Ver no Pipeline
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function OpportunitiesHistory({ clientId, onCreateOpportunity }: OpportunitiesHistoryProps) {
  const { data: opportunities, isLoading } = useClientOpportunities(clientId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const activeOpportunities = opportunities?.filter(o => !['convertido', 'perdido'].includes(o.status)) || [];
  const successCount = opportunities?.filter(o => o.status === 'convertido').length || 0;
  const failedCount = opportunities?.filter(o => o.status === 'perdido').length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Histórico de Oportunidades</CardTitle>
          </div>
          {onCreateOpportunity && (
            <Button size="sm" variant="outline" onClick={onCreateOpportunity} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Oportunidade
            </Button>
          )}
        </div>
        <CardDescription className="flex items-center gap-4">
          <span>{opportunities?.length || 0} oportunidade(s) registrada(s)</span>
          {successCount > 0 && (
            <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              {successCount} sucesso(s)
            </Badge>
          )}
          {failedCount > 0 && (
            <Badge variant="outline" className="gap-1 text-destructive border-destructive">
              <XCircle className="h-3 w-3" />
              {failedCount} perdida(s)
            </Badge>
          )}
          {activeOpportunities.length > 0 && (
            <Badge variant="outline" className="gap-1 text-primary border-primary">
              <Clock className="h-3 w-3" />
              {activeOpportunities.length} em andamento
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {opportunities && opportunities.length > 0 ? (
          <div className="space-y-4">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Nenhuma oportunidade registrada</p>
            {onCreateOpportunity && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 gap-2"
                onClick={onCreateOpportunity}
              >
                <Plus className="h-4 w-4" />
                Criar primeira oportunidade
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
