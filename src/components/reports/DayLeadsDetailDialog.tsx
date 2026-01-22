import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, CheckCircle2, XCircle, Phone, Mail, User, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  created_at: string;
  converted_at?: string | null;
  updated_at: string;
  origin?: { name: string } | null;
  campaign?: { name: string } | null;
  assessor?: { name: string } | null;
}

interface DayLeadsDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  leads: {
    created: Lead[];
    converted: Lead[];
    lost: Lead[];
  };
}

function LeadCard({ lead, type }: { lead: Lead; type: 'created' | 'converted' | 'lost' }) {
  const typeConfig = {
    created: { color: 'bg-blue-500/10 border-blue-500/30', icon: Plus, iconColor: 'text-blue-500' },
    converted: { color: 'bg-green-500/10 border-green-500/30', icon: CheckCircle2, iconColor: 'text-green-500' },
    lost: { color: 'bg-red-500/10 border-red-500/30', icon: XCircle, iconColor: 'text-red-500' },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Link
      to={`/leads/${lead.id}`}
      className={`block p-3 rounded-lg border ${config.color} hover:opacity-80 transition-opacity`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 ${config.iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium truncate">{lead.name}</h4>
            <Badge variant="outline" className="shrink-0 text-xs">
              {lead.status === 'novo' && 'Novo'}
              {lead.status === 'em_contato' && 'Em Contato'}
              {lead.status === 'troca_assessoria' && 'Troca'}
              {lead.status === 'convertido' && 'Convertido'}
              {lead.status === 'perdido' && 'Perdido'}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {lead.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {lead.email}
              </span>
            )}
            {lead.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {lead.phone}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {lead.assessor?.name && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {lead.assessor.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(parseISO(lead.created_at), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>

          {(lead.origin?.name || lead.campaign?.name) && (
            <div className="flex flex-wrap gap-1 mt-1">
              {lead.origin?.name && (
                <Badge variant="secondary" className="text-[10px]">
                  {lead.origin.name}
                </Badge>
              )}
              {lead.campaign?.name && (
                <Badge variant="secondary" className="text-[10px]">
                  {lead.campaign.name}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function DayLeadsDetailDialog({
  open,
  onOpenChange,
  date,
  leads,
}: DayLeadsDetailDialogProps) {
  if (!date) return null;

  const hasCreated = leads.created.length > 0;
  const hasConverted = leads.converted.length > 0;
  const hasLost = leads.lost.length > 0;
  const hasAnyLeads = hasCreated || hasConverted || hasLost;

  const defaultTab = hasCreated ? 'created' : hasConverted ? 'converted' : 'lost';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Plus className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Cadastrados</p>
              <p className="text-lg font-bold text-blue-600">{leads.created.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Convertidos</p>
              <p className="text-lg font-bold text-green-600">{leads.converted.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <XCircle className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Perdidos</p>
              <p className="text-lg font-bold text-red-600">{leads.lost.length}</p>
            </div>
          </div>
        </div>

        {/* Leads Tabs */}
        {hasAnyLeads ? (
          <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="created" disabled={!hasCreated} className="gap-1">
                <Plus className="h-3 w-3" />
                Cadastrados ({leads.created.length})
              </TabsTrigger>
              <TabsTrigger value="converted" disabled={!hasConverted} className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Convertidos ({leads.converted.length})
              </TabsTrigger>
              <TabsTrigger value="lost" disabled={!hasLost} className="gap-1">
                <XCircle className="h-3 w-3" />
                Perdidos ({leads.lost.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="created" className="flex-1 min-h-0 mt-4">
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-2">
                  {leads.created.map((lead) => (
                    <LeadCard key={`created-${lead.id}`} lead={lead} type="created" />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="converted" className="flex-1 min-h-0 mt-4">
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-2">
                  {leads.converted.map((lead) => (
                    <LeadCard key={`converted-${lead.id}`} lead={lead} type="converted" />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="lost" className="flex-1 min-h-0 mt-4">
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-2">
                  {leads.lost.map((lead) => (
                    <LeadCard key={`lost-${lead.id}`} lead={lead} type="lost" />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex-1 flex items-center justify-center py-12 text-muted-foreground">
            Nenhum lead registrado nesta data
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
