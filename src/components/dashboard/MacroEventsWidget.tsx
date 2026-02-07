import { useNavigate } from 'react-router-dom';
import { CalendarClock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUpcomingMacroEvents, EVENT_TYPE_CONFIG, IMPACT_CONFIG } from '@/hooks/useMacroEvents';
import { format, parseISO, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatEventDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Hoje';
  if (isTomorrow(date)) return 'Amanhã';
  const days = differenceInDays(date, new Date());
  if (days <= 6) return `Em ${days} dias`;
  return format(date, "dd MMM", { locale: ptBR });
}

function getDateBadgeColor(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  if (isTomorrow(date)) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  return 'bg-muted text-muted-foreground';
}

export function MacroEventsWidget() {
  const navigate = useNavigate();
  const { data: events, isLoading } = useUpcomingMacroEvents(7);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Eventos Macro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Deduplicate events on the same date with same type (e.g., Super Quarta overlaps)
  const displayEvents = events?.slice(0, 5) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-5 w-5" />
          Eventos Macro
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate('/macro-events')} className="gap-1">
          Ver todos
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {displayEvents.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum evento nos próximos 7 dias</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayEvents.map((event) => {
              const typeConfig = EVENT_TYPE_CONFIG[event.event_type];
              const impactConfig = IMPACT_CONFIG[event.impact_level];

              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="text-xl flex-shrink-0 mt-0.5">
                    {typeConfig.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">
                        {event.name}
                      </span>
                      {event.impact_level === 'high' && (
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${impactConfig.color}`}>
                          {impactConfig.label}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getDateBadgeColor(event.event_date)}`}>
                        {formatEventDate(event.event_date)}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeConfig.color}`}>
                        {typeConfig.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(events?.length || 0) > 5 && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            +{(events?.length || 0) - 5} outros eventos esta semana
          </p>
        )}
      </CardContent>
    </Card>
  );
}
