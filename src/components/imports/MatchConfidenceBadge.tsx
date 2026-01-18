import { MatchConfidence, MatchMethod, getMatchMethodLabel } from '@/utils/clientMatcher';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle2, AlertCircle, HelpCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchConfidenceBadgeProps {
  confidence: MatchConfidence;
  matchedBy: MatchMethod;
  clientName?: string;
}

export function MatchConfidenceBadge({ 
  confidence, 
  matchedBy, 
  clientName 
}: MatchConfidenceBadgeProps) {
  const getIcon = () => {
    switch (confidence) {
      case 'high':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <HelpCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getBadgeVariant = () => {
    switch (confidence) {
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  const getTooltipText = () => {
    if (!matchedBy) {
      return 'Cliente não encontrado na base de dados';
    }
    
    const methodLabel = getMatchMethodLabel(matchedBy);
    const confidenceLabel = confidence === 'high' 
      ? 'Alta confiança' 
      : confidence === 'low' 
        ? 'Baixa confiança - verifique' 
        : 'Média confiança';
    
    return `Vinculado por: ${methodLabel}\n${confidenceLabel}${clientName ? `\nCliente: ${clientName}` : ''}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            {getIcon()}
            {matchedBy && (
              <Badge 
                variant={getBadgeVariant()} 
                className={cn(
                  "text-[10px] px-1",
                  confidence === 'low' && "border-orange-300 text-orange-600"
                )}
              >
                {getMatchMethodLabel(matchedBy)}
              </Badge>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent className="whitespace-pre-line">
          {getTooltipText()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
