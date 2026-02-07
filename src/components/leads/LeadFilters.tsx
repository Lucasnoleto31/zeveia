import { useState, useEffect } from 'react';
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
import { Search, X, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadType } from '@/hooks/useLeads';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface LeadFiltersProps {
  filters: {
    search: string;
    originId?: string;
    campaignId?: string;
    partnerId?: string;
    assessorId?: string;
    leadType?: LeadType;
  };
  onFiltersChange: (filters: any) => void;
  showAssessorFilter?: boolean;
}

export function LeadFilters({ filters, onFiltersChange, showAssessorFilter }: LeadFiltersProps) {
  const { data: origins } = useOrigins();
  const { data: campaigns } = useCampaigns();
  const { data: partners } = usePartners({ active: true });
  const { data: assessors } = useAssessors();

  // Local search state for immediate UI feedback
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(localSearch, 300);

  // Sync debounced search to parent filters
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch]);

  // Sync external filter changes (e.g., clear) to local state
  useEffect(() => {
    if (filters.search !== localSearch && filters.search === '') {
      setLocalSearch('');
    }
  }, [filters.search]);

  const hasActiveFilters = filters.search || filters.originId || filters.campaignId || filters.partnerId || filters.assessorId || (filters.leadType && filters.leadType !== 'all');

  const clearFilters = () => {
    onFiltersChange({ search: '', leadType: 'all' });
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Lead Type Filter */}
      <Select
        value={filters.leadType || "all"}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, leadType: value as LeadType })
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Todos os Leads
            </span>
          </SelectItem>
          <SelectItem value="new">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Leads Novos
            </span>
          </SelectItem>
          <SelectItem value="opportunity">
            <span className="flex items-center gap-2">
              <Target className="h-4 w-4 text-accent-foreground" />
              Oportunidades
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar leads..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-9 w-64"
        />
      </div>

      {/* Origin Filter */}
      <Select
        value={filters.originId || "all"}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, originId: value === "all" ? undefined : value })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Origem" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas origens</SelectItem>
          {origins?.filter(o => o.active).map((origin) => (
            <SelectItem key={origin.id} value={origin.id}>
              {origin.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Campaign Filter */}
      <Select
        value={filters.campaignId || "all"}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, campaignId: value === "all" ? undefined : value })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Campanha" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas campanhas</SelectItem>
          {campaigns?.filter(c => c.active).map((campaign) => (
            <SelectItem key={campaign.id} value={campaign.id}>
              {campaign.name}
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
          value={filters.assessorId || "mine"}
          onValueChange={(value) => 
            onFiltersChange({ ...filters, assessorId: value === "mine" ? undefined : value })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Assessor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mine">Meus Leads</SelectItem>
            <SelectItem value="all">Todos assessores</SelectItem>
            {assessors?.map((assessor) => (
              <SelectItem key={assessor.user_id} value={assessor.user_id}>
                {assessor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

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
