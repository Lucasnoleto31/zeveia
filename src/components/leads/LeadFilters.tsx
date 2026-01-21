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

interface LeadFiltersProps {
  filters: {
    search: string;
    originId?: string;
    campaignId?: string;
    partnerId?: string;
    assessorId?: string;
  };
  onFiltersChange: (filters: any) => void;
  showAssessorFilter?: boolean;
}

export function LeadFilters({ filters, onFiltersChange, showAssessorFilter }: LeadFiltersProps) {
  const { data: origins } = useOrigins();
  const { data: campaigns } = useCampaigns();
  const { data: partners } = usePartners({ active: true });
  const { data: assessors } = useAssessors();

  const hasActiveFilters = filters.search || filters.originId || filters.campaignId || filters.partnerId || filters.assessorId;

  const clearFilters = () => {
    onFiltersChange({ search: '' });
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar leads..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
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
