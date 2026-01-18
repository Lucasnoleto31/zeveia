import { AlertType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Cake, UserX, Phone, TrendingUp } from 'lucide-react';
import { AlertFilters as AlertFiltersType } from '@/hooks/useAlerts';

interface AlertFiltersProps {
  filters: AlertFiltersType;
  onFiltersChange: (filters: AlertFiltersType) => void;
}

const alertTypes: { value: AlertType; label: string; icon: React.ElementType }[] = [
  { value: 'aniversario', label: 'Aniversário', icon: Cake },
  { value: 'inativo', label: 'Cliente Inativo', icon: UserX },
  { value: 'follow_up', label: 'Follow-up', icon: Phone },
  { value: 'cross_selling', label: 'Cross-selling', icon: TrendingUp },
];

export function AlertFilters({ filters, onFiltersChange }: AlertFiltersProps) {
  const hasActiveFilters = filters.type || filters.read !== undefined || filters.search;

  const clearFilters = () => {
    onFiltersChange({ dismissed: false });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar alertas..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
          className="pl-9"
        />
      </div>

      {/* Type filter */}
      <Select
        value={filters.type || 'all'}
        onValueChange={(value) => 
          onFiltersChange({ 
            ...filters, 
            type: value === 'all' ? undefined : value as AlertType 
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Tipo de alerta" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tipos</SelectItem>
          {alertTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              <div className="flex items-center gap-2">
                <type.icon className="h-4 w-4" />
                {type.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select
        value={filters.read === undefined ? 'all' : filters.read ? 'read' : 'unread'}
        onValueChange={(value) => 
          onFiltersChange({ 
            ...filters, 
            read: value === 'all' ? undefined : value === 'read'
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="unread">Não lidos</SelectItem>
          <SelectItem value="read">Lidos</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
