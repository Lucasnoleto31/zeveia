import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { InfluencerProfile } from '@/types/influencer';
import { getMainPlatform, formatFollowers } from '@/hooks/useInfluencers';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  GripVertical,
  Pencil,
  ExternalLink,
  Instagram,
  Youtube,
  Twitter,
  Star,
} from 'lucide-react';

interface InfluencerCardProps {
  influencer: InfluencerProfile;
  onEdit?: () => void;
  isDragging?: boolean;
}

export function InfluencerCard({ influencer, onEdit, isDragging }: InfluencerCardProps) {
  const navigate = useNavigate();
  const isFinalized = influencer.stage === 'lost' || influencer.stage === 'paused';

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: influencer.id,
    disabled: isFinalized,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const mainPlatform = getMainPlatform(influencer);
  const score = Number(influencer.qualification_score) || 0;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/influencers/${influencer.id}`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Instagram':
        return <Instagram className="h-3 w-3" />;
      case 'YouTube':
        return <Youtube className="h-3 w-3" />;
      case 'Twitter':
        return <Twitter className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const totalFollowers =
    (influencer.instagram_followers || 0) +
    (influencer.youtube_subscribers || 0) +
    (influencer.twitter_followers || 0) +
    (influencer.tiktok_followers || 0);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={cn(
        'cursor-pointer transition-shadow hover:shadow-md',
        !isFinalized && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 shadow-lg rotate-2',
        isFinalized && 'opacity-70 cursor-default'
      )}
    >
      <CardContent className="p-3">
        {/* Header with drag handle */}
        <div className="flex items-start gap-2">
          {!isFinalized && (
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-sm truncate">{influencer.name}</h4>
              <div className="flex items-center gap-1">
                {onEdit && !isFinalized && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/influencers/${influencer.id}`);
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Platform */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          {getPlatformIcon(mainPlatform.platform)}
          <span className="truncate">{mainPlatform.handle}</span>
          {mainPlatform.followers > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">
              {formatFollowers(mainPlatform.followers)}
            </Badge>
          )}
        </div>

        {/* Total Followers */}
        {totalFollowers > 0 && (
          <div className="mt-1 text-[10px] text-muted-foreground">
            Total: {formatFollowers(totalFollowers)} seguidores
          </div>
        )}

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1">
          {score > 0 && (
            <Badge className={cn('text-[10px] px-1.5 py-0', getScoreColor(score))}>
              <Star className="h-2.5 w-2.5 mr-0.5" />
              {score.toFixed(0)}
            </Badge>
          )}
          {influencer.niche?.slice(0, 2).map((n) => (
            <Badge key={n} variant="outline" className="text-[10px] px-1.5 py-0">
              {n.replace('_', ' ')}
            </Badge>
          ))}
          {influencer.engagement_rate && Number(influencer.engagement_rate) > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {Number(influencer.engagement_rate).toFixed(1)}% eng
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
