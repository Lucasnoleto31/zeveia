import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalWithProgress {
  id: string;
  type: string;
  target_value: number;
  actual: number;
  progress: number;
  is_office_goal: boolean;
}

interface GoalCardProps {
  goal: GoalWithProgress;
  icon: React.ReactNode;
  label: string;
  onEdit?: () => void;
  onDelete?: () => void;
  formatValue: (value: number) => string;
}

export function GoalCard({ goal, icon, label, onEdit, onDelete, formatValue }: GoalCardProps) {
  const progressColor = goal.progress >= 100 
    ? 'bg-green-500' 
    : goal.progress >= 75 
      ? 'bg-primary' 
      : goal.progress >= 50 
        ? 'bg-yellow-500' 
        : 'bg-destructive';

  return (
    <Card className={cn(
      goal.progress >= 100 && 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20'
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {label}
        </CardTitle>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
                <Pencil className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">{formatValue(goal.actual)}</p>
            <p className="text-xs text-muted-foreground">
              de {formatValue(Number(goal.target_value))}
            </p>
          </div>
          <div className={cn(
            'text-lg font-bold',
            goal.progress >= 100 ? 'text-green-600' : 
            goal.progress >= 75 ? 'text-primary' :
            goal.progress >= 50 ? 'text-yellow-600' : 'text-destructive'
          )}>
            {goal.progress.toFixed(0)}%
          </div>
        </div>
        <Progress 
          value={goal.progress} 
          className="h-2"
          // @ts-ignore - custom indicator color
          indicatorClassName={progressColor}
        />
        {goal.progress >= 100 && (
          <p className="text-xs text-green-600 font-medium text-center">
            🎉 Meta atingida!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
