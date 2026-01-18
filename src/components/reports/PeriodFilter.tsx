import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export interface PeriodFilterProps {
  periodType: 'preset' | 'custom';
  onPeriodTypeChange: (type: 'preset' | 'custom') => void;
  months: number;
  onMonthsChange: (months: number) => void;
  customStartDate?: Date;
  onCustomStartDateChange: (date?: Date) => void;
  customEndDate?: Date;
  onCustomEndDateChange: (date?: Date) => void;
  presetOptions?: { value: number; label: string }[];
}

const defaultPresetOptions = [
  { value: 3, label: 'Últimos 3 meses' },
  { value: 6, label: 'Últimos 6 meses' },
  { value: 12, label: 'Últimos 12 meses' },
];

export function PeriodFilter({
  periodType,
  onPeriodTypeChange,
  months,
  onMonthsChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  presetOptions = defaultPresetOptions,
}: PeriodFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ToggleGroup
        type="single"
        value={periodType}
        onValueChange={(v) => v && onPeriodTypeChange(v as 'preset' | 'custom')}
        className="border rounded-md"
      >
        <ToggleGroupItem value="preset" aria-label="Período predefinido" className="text-xs px-3">
          Predefinido
        </ToggleGroupItem>
        <ToggleGroupItem value="custom" aria-label="Período personalizado" className="text-xs px-3">
          Personalizado
        </ToggleGroupItem>
      </ToggleGroup>

      {periodType === 'preset' ? (
        <Select value={months.toString()} onValueChange={(v) => onMonthsChange(parseInt(v))}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {presetOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value.toString()}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[140px] justify-start text-left font-normal',
                  !customStartDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customStartDate ? (
                  format(customStartDate, 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  <span>Início</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customStartDate}
                onSelect={onCustomStartDateChange}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">até</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[140px] justify-start text-left font-normal',
                  !customEndDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customEndDate ? (
                  format(customEndDate, 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  <span>Fim</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customEndDate}
                onSelect={onCustomEndDateChange}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}

export function getPeriodLabel(
  periodType: 'preset' | 'custom',
  months: number,
  customStartDate?: Date,
  customEndDate?: Date
): string {
  if (periodType === 'custom' && customStartDate && customEndDate) {
    return `${format(customStartDate, 'dd/MM/yyyy')} a ${format(customEndDate, 'dd/MM/yyyy')}`;
  }
  return `Últimos ${months} meses`;
}
