import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DailyLeadMetrics } from '@/hooks/useFunnelReport';

interface LeadsCalendarViewProps {
  dailyMetrics: DailyLeadMetrics[];
  onSelectDate?: (date: Date) => void;
  selectedDate?: Date;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function LeadsCalendarView({ dailyMetrics, onSelectDate, selectedDate }: LeadsCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Create a map of daily metrics for quick lookup
  const metricsMap = useMemo(() => {
    const map = new Map<string, DailyLeadMetrics>();
    dailyMetrics.forEach((metric) => {
      map.set(metric.date, metric);
    });
    return map;
  }, [dailyMetrics]);

  // Get all days in the current month view (including padding days)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Calculate monthly totals for the displayed month
  const monthlyTotals = useMemo(() => {
    let created = 0;
    let converted = 0;
    let lost = 0;

    calendarDays.forEach((day) => {
      if (isSameMonth(day, currentMonth)) {
        const dateKey = format(day, 'yyyy-MM-dd');
        const metrics = metricsMap.get(dateKey);
        if (metrics) {
          created += metrics.created;
          converted += metrics.converted;
          lost += metrics.lost;
        }
      }
    });

    return { created, converted, lost };
  }, [calendarDays, currentMonth, metricsMap]);

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return (
    <div className="space-y-4">
      {/* Monthly Totals */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Plus className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">Novos no mês</p>
            <p className="text-lg font-bold text-blue-600">{monthlyTotals.created}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-xs text-muted-foreground">Convertidos</p>
            <p className="text-lg font-bold text-green-600">{monthlyTotals.converted}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <XCircle className="h-4 w-4 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">Perdidos</p>
            <p className="text-lg font-bold text-red-600">{monthlyTotals.lost}</p>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold capitalize ml-2">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Hoje
        </Button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <TooltipProvider>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const metrics = metricsMap.get(dateKey);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const hasActivity = metrics && (metrics.created > 0 || metrics.converted > 0 || metrics.lost > 0);

            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelectDate?.(day)}
                    className={`
                      relative min-h-[70px] p-1 rounded-md border transition-colors
                      ${isCurrentMonth ? 'bg-card' : 'bg-muted/30 text-muted-foreground'}
                      ${isTodayDate ? 'border-primary ring-1 ring-primary' : 'border-border'}
                      ${isSelected ? 'bg-primary/10' : ''}
                      ${hasActivity ? 'hover:bg-accent' : 'hover:bg-muted/50'}
                    `}
                  >
                    <span className={`
                      absolute top-1 left-1 text-xs font-medium
                      ${isTodayDate ? 'bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center' : ''}
                    `}>
                      {format(day, 'd')}
                    </span>

                    {/* Daily Metrics */}
                    {isCurrentMonth && hasActivity && (
                      <div className="mt-5 flex flex-wrap gap-0.5 justify-center">
                        {metrics.created > 0 && (
                          <span className="inline-flex items-center text-[10px] font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/30 rounded px-1">
                            +{metrics.created}
                          </span>
                        )}
                        {metrics.converted > 0 && (
                          <span className="inline-flex items-center text-[10px] font-medium text-green-600 bg-green-100 dark:bg-green-900/30 rounded px-1">
                            ✓{metrics.converted}
                          </span>
                        )}
                        {metrics.lost > 0 && (
                          <span className="inline-flex items-center text-[10px] font-medium text-red-600 bg-red-100 dark:bg-red-900/30 rounded px-1">
                            ✗{metrics.lost}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                {hasActivity && (
                  <TooltipContent side="top" className="p-3">
                    <div className="space-y-1.5">
                      <p className="font-semibold">
                        {format(day, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                          <span>{metrics?.created || 0} leads cadastrados</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                          <span>{metrics?.converted || 0} leads convertidos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                          <span>{metrics?.lost || 0} leads perdidos</span>
                        </div>
                        <div className="pt-1 border-t text-muted-foreground">
                          Saldo: {((metrics?.converted || 0) - (metrics?.lost || 0)) >= 0 ? '+' : ''}{(metrics?.converted || 0) - (metrics?.lost || 0)}
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 text-center text-[8px] font-bold">+</span>
          <span>Novos</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-green-100 dark:bg-green-900/30 rounded text-green-600 text-center text-[8px] font-bold">✓</span>
          <span>Convertidos</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-red-100 dark:bg-red-900/30 rounded text-red-600 text-center text-[8px] font-bold">✗</span>
          <span>Perdidos</span>
        </div>
      </div>
    </div>
  );
}
