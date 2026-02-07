import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarClock,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  useMacroEvents,
  MacroEventType,
  ImpactLevel,
  MacroEvent,
  EVENT_TYPE_CONFIG,
  IMPACT_CONFIG,
} from '@/hooks/useMacroEvents';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const ALL_EVENT_TYPES: { value: MacroEventType; label: string }[] = [
  { value: 'fomc', label: 'FOMC' },
  { value: 'copom', label: 'Copom' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'cpi', label: 'CPI' },
  { value: 'ipca', label: 'IPCA' },
  { value: 'pib', label: 'PIB' },
  { value: 'earnings', label: 'Balanços' },
  { value: 'options_expiry', label: 'Venc. Opções' },
  { value: 'contract_rollover', label: 'Rolagem' },
  { value: 'other', label: 'Outros' },
];

function EventTypeTag({ type }: { type: MacroEventType }) {
  const config = EVENT_TYPE_CONFIG[type];
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.color}`}>
      {config.emoji} {config.label}
    </Badge>
  );
}

function ImpactTag({ level }: { level: ImpactLevel }) {
  const config = IMPACT_CONFIG[level];
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.color}`}>
      {level === 'high' ? '🔴' : level === 'medium' ? '🟡' : '🟢'} {config.label}
    </Badge>
  );
}

export default function MacroEventsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<MacroEventType | 'all'>('all');
  const [filterImpact, setFilterImpact] = useState<ImpactLevel | 'all'>('all');
  const [filterCountry, setFilterCountry] = useState<'all' | 'BR' | 'US'>('all');

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  // Fetch all events for the current year to avoid refetching on month navigation
  const startDate = `${currentMonth.getFullYear()}-01-01`;
  const endDate = `${currentMonth.getFullYear()}-12-31`;

  const { data: allEvents = [], isLoading } = useMacroEvents({
    startDate,
    endDate,
    eventType: filterType !== 'all' ? filterType : undefined,
    impactLevel: filterImpact !== 'all' ? filterImpact : undefined,
    country: filterCountry !== 'all' ? filterCountry : undefined,
    search: debouncedSearch || undefined,
  });

  // Calendar data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0=Sunday

  // Map events by date for quick lookup
  const eventsByDate = useMemo(() => {
    const map = new Map<string, MacroEvent[]>();
    for (const event of allEvents) {
      const dateKey = event.event_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    }
    return map;
  }, [allEvents]);

  // Events for the current month (for the list view)
  const monthEvents = useMemo(() => {
    const monthStr = format(currentMonth, 'yyyy-MM');
    return allEvents.filter(e => e.event_date.startsWith(monthStr));
  }, [allEvents, currentMonth]);

  // Events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return eventsByDate.get(dateKey) || [];
  }, [selectedDate, eventsByDate]);

  const hasActiveFilters = debouncedSearch || filterType !== 'all' || filterImpact !== 'all' || filterCountry !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterImpact('all');
    setFilterCountry('all');
  };

  const goToPrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Count events by type for stats
  const statsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of monthEvents) {
      counts[event.event_type] = (counts[event.event_type] || 0) + 1;
    }
    return counts;
  }, [monthEvents]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Calendário Macro</h1>
              <p className="text-sm text-muted-foreground">
                Eventos macroeconômicos relevantes para traders B3
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-56"
            />
          </div>

          <Select
            value={filterType}
            onValueChange={(v) => setFilterType(v as MacroEventType | 'all')}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {ALL_EVENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {EVENT_TYPE_CONFIG[t.value].emoji} {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterImpact}
            onValueChange={(v) => setFilterImpact(v as ImpactLevel | 'all')}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Impacto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="high">🔴 Alto</SelectItem>
              <SelectItem value="medium">🟡 Médio</SelectItem>
              <SelectItem value="low">🟢 Baixo</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterCountry}
            onValueChange={(v) => setFilterCountry(v as 'all' | 'BR' | 'US')}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="País" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="BR">🇧🇷 Brasil</SelectItem>
              <SelectItem value="US">🇺🇸 EUA</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(statsByType).map(([type, count]) => {
            const config = EVENT_TYPE_CONFIG[type as MacroEventType];
            return (
              <Badge
                key={type}
                variant="outline"
                className={`${config.color} cursor-pointer`}
                onClick={() => setFilterType(type as MacroEventType)}
              >
                {config.emoji} {config.label}: {count}
              </Badge>
            );
          })}
          {monthEvents.length > 0 && (
            <Badge variant="secondary">
              Total: {monthEvents.length} eventos
            </Badge>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-lg min-w-[180px] text-center">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoje
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                  {/* Weekday headers */}
                  {WEEKDAY_LABELS.map((label) => (
                    <div
                      key={label}
                      className="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground"
                    >
                      {label}
                    </div>
                  ))}

                  {/* Empty cells before month starts */}
                  {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-background p-2 min-h-[80px]" />
                  ))}

                  {/* Calendar days */}
                  {daysInMonth.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayEvents = eventsByDate.get(dateKey) || [];
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const today = isToday(day);

                    return (
                      <div
                        key={dateKey}
                        className={cn(
                          'bg-background p-1.5 min-h-[80px] cursor-pointer transition-colors hover:bg-muted/50',
                          isSelected && 'ring-2 ring-primary ring-inset',
                          today && 'bg-primary/5'
                        )}
                        onClick={() => setSelectedDate(day)}
                      >
                        <div className={cn(
                          'text-xs font-medium mb-1',
                          today && 'text-primary font-bold',
                          !isSameMonth(day, currentMonth) && 'text-muted-foreground'
                        )}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map((event) => {
                            const config = EVENT_TYPE_CONFIG[event.event_type];
                            return (
                              <div
                                key={event.id}
                                className={cn(
                                  'text-[9px] leading-tight px-1 py-0.5 rounded truncate',
                                  config.color
                                )}
                                title={event.name}
                              >
                                {config.emoji} {event.name.replace(/\s*-\s*(Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro).*/, '').replace(/\s*\(.*\)/, '')}
                              </div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <div className="text-[9px] text-muted-foreground px-1">
                              +{dayEvents.length - 3} mais
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Details Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedDate
                  ? format(selectedDate, "d 'de' MMMM", { locale: ptBR })
                  : 'Eventos do Mês'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {(selectedDate ? selectedDateEvents : monthEvents).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {selectedDate
                          ? 'Nenhum evento nesta data'
                          : 'Nenhum evento neste mês'}
                      </p>
                    </div>
                  ) : (
                    (selectedDate ? selectedDateEvents : monthEvents).map((event) => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg flex-shrink-0">
                            {EVENT_TYPE_CONFIG[event.event_type].emoji}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{event.name}</p>
                            {!selectedDate && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {format(parseISO(event.event_date), "d 'de' MMMM (EEEE)", { locale: ptBR })}
                              </p>
                            )}
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              <EventTypeTag type={event.event_type} />
                              <ImpactTag level={event.impact_level} />
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {event.country === 'BR' ? '🇧🇷' : '🇺🇸'} {event.country}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => setSelectedDate(null)}
                >
                  Ver todos do mês
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
