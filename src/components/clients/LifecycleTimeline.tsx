import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientLifecycleEvent, LIFECYCLE_STAGES, ClientLifecycleStage } from '@/types/retention';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight, Clock } from 'lucide-react';

interface LifecycleTimelineProps {
  clientId: string;
}

function useClientLifecycle(clientId: string) {
  return useQuery({
    queryKey: ['clientLifecycle', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_lifecycle')
        .select('*')
        .eq('client_id', clientId)
        .order('changed_at', { ascending: false });

      if (error) throw error;

      // Get user names for changed_by
      const userIds = [...new Set((data || []).map(e => e.changed_by).filter(Boolean))];
      let profilesMap = new Map<string, string>();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', userIds);

        profilesMap = new Map((profiles || []).map(p => [p.user_id, p.name]));
      }

      return (data || []).map(event => ({
        ...event,
        user: event.changed_by ? { name: profilesMap.get(event.changed_by) || 'Sistema' } : { name: 'Sistema' },
      })) as ClientLifecycleEvent[];
    },
    enabled: !!clientId,
  });
}

// Stage indicator dot
function StageDot({ stage, isLatest }: { stage: ClientLifecycleStage; isLatest: boolean }) {
  const meta = LIFECYCLE_STAGES[stage];
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full text-lg',
        isLatest ? 'h-10 w-10 shadow-md' : 'h-8 w-8',
        meta.color,
      )}
    >
      {meta.icon}
    </div>
  );
}

// Current stage badge (prominent)
function CurrentStageBadge({ stage }: { stage: ClientLifecycleStage }) {
  const meta = LIFECYCLE_STAGES[stage];
  return (
    <Badge className={cn('text-sm px-3 py-1', meta.color)}>
      {meta.icon} {meta.label}
    </Badge>
  );
}

export function LifecycleTimeline({ clientId }: LifecycleTimelineProps) {
  const { data: events, isLoading } = useClientLifecycle(clientId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Ciclo de Vida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentStage = events && events.length > 0 ? events[0].stage : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Ciclo de Vida</CardTitle>
              <CardDescription>Histórico de estágios do cliente</CardDescription>
            </div>
          </div>
          {currentStage && <CurrentStageBadge stage={currentStage} />}
        </div>
      </CardHeader>
      <CardContent>
        {!events || events.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-sm">
            Nenhum registro de ciclo de vida encontrado.
            <br />
            <span className="text-xs">O ciclo de vida será registrado automaticamente conforme o health score evolui.</span>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-border" />

            <div className="space-y-6">
              {events.map((event, index) => {
                const isLatest = index === 0;
                const meta = LIFECYCLE_STAGES[event.stage];
                const prevMeta = event.previous_stage ? LIFECYCLE_STAGES[event.previous_stage] : null;

                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Dot */}
                    <div className="relative z-10 flex-shrink-0">
                      <StageDot stage={event.stage} isLatest={isLatest} />
                    </div>

                    {/* Content */}
                    <div className={cn('flex-1 min-w-0 pb-2', isLatest && 'pt-1')}>
                      <div className="flex items-center gap-2 flex-wrap">
                        {prevMeta && (
                          <>
                            <Badge variant="outline" className={cn('text-xs', prevMeta.color)}>
                              {prevMeta.icon} {prevMeta.label}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          </>
                        )}
                        <Badge className={cn('text-xs', meta.color)}>
                          {meta.icon} {meta.label}
                        </Badge>
                      </div>

                      {event.reason && (
                        <p className="text-sm text-muted-foreground mt-1">{event.reason}</p>
                      )}

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.changed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(event.changed_at), { addSuffix: true, locale: ptBR })}
                        </span>
                        {event.user && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{event.user.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
