import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Clock, Users, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CampaignCardData {
  campaign: string;
  campaignId: string | null;
  firstLeadDate: string;
  lastLeadDate: string;
  total: number;
  converted: number;
  lost: number;
  inProgress: number;
  conversionRate: number;
  lossReasons: { reason: string; count: number }[];
  origins: { origin: string; count: number }[];
  assessors: { assessor: string; count: number; converted: number }[];
}

interface CampaignDetailCardProps {
  campaign: CampaignCardData;
}

export function CampaignDetailCard({ campaign }: CampaignDetailCardProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const isSameDay = campaign.firstLeadDate === campaign.lastLeadDate;
  const dateDisplay = isSameDay 
    ? formatDate(campaign.firstLeadDate)
    : `${formatDate(campaign.firstLeadDate)} - ${formatDate(campaign.lastLeadDate)}`;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2 flex-wrap">
            <Megaphone className="h-4 w-4 text-primary shrink-0" />
            <span className="break-words">{campaign.campaign}</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs shrink-0">
            {dateDisplay}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-3 w-3 text-primary" />
            </div>
            <p className="text-xl font-bold text-primary">{campaign.total}</p>
            <p className="text-xs text-muted-foreground">Captados</p>
          </div>
          <div className="text-center p-3 bg-green-600/10 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
            </div>
            <p className="text-xl font-bold text-green-600">{campaign.converted}</p>
            <p className="text-xs text-muted-foreground">
              {campaign.total > 0 ? `(${((campaign.converted / campaign.total) * 100).toFixed(0)}%)` : '(0%)'}
            </p>
          </div>
          <div className="text-center p-3 bg-destructive/10 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="h-3 w-3 text-destructive" />
            </div>
            <p className="text-xl font-bold text-destructive">{campaign.lost}</p>
            <p className="text-xs text-muted-foreground">
              {campaign.total > 0 ? `(${((campaign.lost / campaign.total) * 100).toFixed(0)}%)` : '(0%)'}
            </p>
          </div>
        </div>

        {/* Em Andamento */}
        <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 rounded-lg dark:bg-amber-500/20">
          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm">
            Em andamento: <strong className="text-amber-700 dark:text-amber-500">{campaign.inProgress}</strong> leads
            {campaign.total > 0 && (
              <span className="text-muted-foreground ml-1">
                ({((campaign.inProgress / campaign.total) * 100).toFixed(0)}%)
              </span>
            )}
          </span>
        </div>

        {/* Motivos de Perda */}
        {campaign.lossReasons.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Motivos de Perda
            </p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {campaign.lossReasons.slice(0, 5).map((lr) => (
                <div key={lr.reason} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">• {lr.reason}</span>
                  <span className="text-destructive font-medium">{lr.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Origens */}
        {campaign.origins.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Por Origem
            </p>
            <div className="flex flex-wrap gap-1.5">
              {campaign.origins.slice(0, 4).map((o) => (
                <Badge key={o.origin} variant="secondary" className="text-xs font-normal">
                  {o.origin}: {o.count}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
