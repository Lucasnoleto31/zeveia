import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrigins, useCampaigns } from '@/hooks/useConfiguration';
import { usePartners } from '@/hooks/usePartners';
import { useAssessors } from '@/hooks/useProfiles';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientType, InvestorProfile } from '@/types/database';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface ClientFiltersProps {
  filters: {
    search: string;
    type?: ClientType;
    profile?: InvestorProfile;
    state?: string;
    partnerId?: string;
    assessorId?: string;
    active?: boolean;
  };
  onFiltersChange: (filters: any) => void;
  showAssessorFilter?: boolean;
}

export function ClientFilters({ filters, onFiltersChange, showAssessorFilter }: ClientFiltersProps) {
  const { data: partners } = usePartners({ active: true });
  const { data: assessors } = useAssessors();

  const hasActiveFilters = filters.search || filters.type || filters.profile || 
    filters.state || filters.partnerId || filters.assessorId || filters.active === false;

  const clearFilters = () => {
    onFiltersChange({ search: '', active: true });
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF, CNPJ..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9 w-64"
        />
      </div>

      {/* Profile Filter */}
      <Select
        value={filters.profile || "all"}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, profile: value === "all" ? undefined : value as InvestorProfile })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Perfil" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos perfis</SelectItem>
          <SelectItem value="conservador">Conservador</SelectItem>
          <SelectItem value="moderado">Moderado</SelectItem>
          <SelectItem value="arrojado">Arrojado</SelectItem>
          <SelectItem value="agressivo">Agressivo</SelectItem>
        </SelectContent>
      </Select>

      {/* State Filter */}
      <Select
        value={filters.state || "all"}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, state: value === "all" ? undefined : value })
        }
      >
        <SelectTrigger className="w-28">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {BRAZILIAN_STATES.map((state) => (
            <SelectItem key={state} value={state}>
              {state}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Partner Filter */}
      <Select
        value={filters.partnerId || "all"}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, partnerId: value === "all" ? undefined : value })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Parceiro" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos parceiros</SelectItem>
          {partners?.map((partner) => (
            <SelectItem key={partner.id} value={partner.id}>
              {partner.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Assessor Filter (only for socio) */}
      {showAssessorFilter && (
        <Select
          value={filters.assessorId || "all"}
          onValueChange={(value) => 
            onFiltersChange({ ...filters, assessorId: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Assessor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos assessores</SelectItem>
            {assessors?.map((assessor) => (
              <SelectItem key={assessor.user_id} value={assessor.user_id}>
                {assessor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Active Toggle */}
      <div className="flex items-center gap-2">
        <Switch
          id="active-filter"
          checked={filters.active !== false}
          onCheckedChange={(checked) => onFiltersChange({ ...filters, active: checked })}
        />
        <Label htmlFor="active-filter" className="text-sm">Ativos</Label>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
