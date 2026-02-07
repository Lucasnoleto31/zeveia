import { useState } from 'react';
import { useLeaderboard } from '@/hooks/useGamification';
import { BADGE_CONFIG, BadgeType } from '@/types/gamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Flame, Medal } from 'lucide-react';

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getLastMonthPeriod(): string {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function LeaderboardWidget() {
  const [periodType, setPeriodType] = useState<'this_month' | 'last_month' | 'all_time'>('this_month');

  const period = periodType === 'this_month'
    ? getCurrentPeriod()
    : periodType === 'last_month'
      ? getLastMonthPeriod()
      : undefined;

  const { data: leaderboard, isLoading } = useLeaderboard(period);

  const top5 = leaderboard?.slice(0, 5) || [];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return (
          <span className="text-sm font-bold text-muted-foreground w-5 text-center">
            {rank}
          </span>
        );
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
      case 2:
        return 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-700';
      case 3:
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Ranking de Assessores
          </CardTitle>
          <Select
            value={periodType}
            onValueChange={(v) => setPeriodType(v as any)}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">Este mês</SelectItem>
              <SelectItem value="last_month">Mês passado</SelectItem>
              <SelectItem value="all_time">Todo período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : top5.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum ponto registrado neste período
          </div>
        ) : (
          <div className="space-y-2">
            {top5.map((entry) => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${getRankBg(entry.rank)}`}
              >
                <div className="flex-shrink-0">
                  {getRankIcon(entry.rank)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {entry.name}
                    </span>
                    {entry.badges.slice(0, 3).map((badge) => (
                      <span
                        key={badge.id}
                        title={
                          BADGE_CONFIG[badge.badge_type as BadgeType]
                            ?.description || badge.badge_name
                        }
                        className="text-sm"
                      >
                        {badge.badge_emoji}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {entry.streak > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Flame className="h-3 w-3 text-orange-500" />
                        {entry.streak} dias
                      </span>
                    )}
                    {entry.badges.length > 3 && (
                      <span>+{entry.badges.length - 3} badges</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <Badge
                    variant={entry.rank === 1 ? 'default' : 'secondary'}
                    className="font-mono"
                  >
                    {entry.total_points.toLocaleString('pt-BR')} pts
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
