import { FunnelStage } from '@/hooks/useFunnelReport';
import { cn } from '@/lib/utils';

interface FunnelChartProps {
  stages: FunnelStage[];
}

export function FunnelChart({ stages }: FunnelChartProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="space-y-3">
      {stages.map((stage, index) => {
        const width = Math.max((stage.count / maxCount) * 100, 10);
        const isLast = index === stages.length - 1;
        
        return (
          <div key={stage.status} className="relative">
            <div
              className={cn(
                'relative h-14 rounded-lg flex items-center justify-between px-4 transition-all duration-300',
                'hover:scale-[1.02] hover:shadow-lg cursor-default'
              )}
              style={{
                width: `${width}%`,
                backgroundColor: stage.color,
                marginLeft: `${(100 - width) / 2}%`,
              }}
            >
              <span className="text-white font-medium text-sm truncate">
                {stage.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-white/90 text-sm">
                  {stage.percentage.toFixed(1)}%
                </span>
                <span className="text-white font-bold text-lg">
                  {stage.count}
                </span>
              </div>
            </div>
            
            {/* Connector */}
            {!isLast && (
              <div 
                className="w-0.5 h-2 mx-auto bg-muted-foreground/30"
                style={{ marginLeft: '50%' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
