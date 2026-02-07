import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HealthScoreComponents, RiskClassification, RISK_CLASSIFICATIONS } from '@/types/retention';

interface HealthScoreBadgeProps {
  score: number;
  classification: RiskClassification;
  components?: HealthScoreComponents;
  variant?: 'small' | 'large';
  showLabel?: boolean;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-green-600 dark:text-green-400';
  if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 25) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreBgColor(score: number): string {
  if (score >= 75) return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800';
  if (score >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
  if (score >= 25) return 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800';
  return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
}

function getScoreRingColor(score: number): string {
  if (score >= 75) return 'stroke-green-500';
  if (score >= 50) return 'stroke-yellow-500';
  if (score >= 25) return 'stroke-orange-500';
  return 'stroke-red-500';
}

function ComponentBar({ label, value }: { label: string; value: number }) {
  const barColor = value >= 75 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : value >= 25 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-20 text-muted-foreground">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-1.5">
        <div
          className={cn('h-1.5 rounded-full transition-all', barColor)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right">{value}</span>
    </div>
  );
}

function TooltipContent_({ components, classification }: { components?: HealthScoreComponents; classification: RiskClassification }) {
  const meta = RISK_CLASSIFICATIONS[classification];

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center gap-2">
        <span className={cn('text-sm font-medium', meta.color)}>{meta.label}</span>
      </div>
      {components && (
        <div className="space-y-1.5 min-w-48">
          <ComponentBar label="Recência" value={components.recency} />
          <ComponentBar label="Frequência" value={components.frequency} />
          <ComponentBar label="Monetário" value={components.monetary} />
          <ComponentBar label="Tendência" value={components.trend} />
          <ComponentBar label="Engajamento" value={components.engagement} />
        </div>
      )}
      <div className="text-[10px] text-muted-foreground pt-1 border-t">
        Pesos: Recência 30% · Freq 25% · Mon 20% · Tend 15% · Eng 10%
      </div>
    </div>
  );
}

// Small variant: inline badge for table rows
function SmallBadge({ score, classification, className }: { score: number; classification: RiskClassification; className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium',
        getScoreBgColor(score),
        getScoreColor(score),
        className,
      )}
    >
      <span className="font-bold">{score}</span>
    </div>
  );
}

// Large variant: circular gauge for detail pages
function LargeBadge({ score, classification, className }: { score: number; classification: RiskClassification; className?: string }) {
  const meta = RISK_CLASSIFICATIONS[classification];
  const circumference = 2 * Math.PI * 36; // r=36
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            className="stroke-muted"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            className={cn(getScoreRingColor(score), 'transition-all duration-700 ease-out')}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-2xl font-bold', getScoreColor(score))}>{score}</span>
        </div>
      </div>
      <span className={cn('text-sm font-medium', meta.color)}>{meta.label}</span>
    </div>
  );
}

export function HealthScoreBadge({
  score,
  classification,
  components,
  variant = 'small',
  showLabel = false,
  className,
}: HealthScoreBadgeProps) {
  const meta = RISK_CLASSIFICATIONS[classification];
  const Badge = variant === 'small' ? SmallBadge : LargeBadge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('inline-flex items-center gap-2 cursor-help', className)}>
          <Badge score={score} classification={classification} />
          {showLabel && variant === 'small' && (
            <span className={cn('text-xs font-medium', meta.color)}>{meta.label}</span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <TooltipContent_ components={components} classification={classification} />
      </TooltipContent>
    </Tooltip>
  );
}
