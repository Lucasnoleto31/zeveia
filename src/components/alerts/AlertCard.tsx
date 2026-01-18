import { Alert, AlertType } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Cake, 
  UserX, 
  Phone, 
  TrendingUp, 
  Check, 
  X, 
  Eye,
  User,
  UserPlus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface AlertCardProps {
  alert: Alert;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

const alertTypeConfig: Record<AlertType, { 
  icon: React.ElementType; 
  label: string; 
  color: string;
  bgColor: string;
}> = {
  aniversario: { 
    icon: Cake, 
    label: 'Aniversário', 
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30'
  },
  inativo: { 
    icon: UserX, 
    label: 'Cliente Inativo', 
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30'
  },
  follow_up: { 
    icon: Phone, 
    label: 'Follow-up', 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30'
  },
  cross_selling: { 
    icon: TrendingUp, 
    label: 'Cross-selling', 
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30'
  },
};

export function AlertCard({ alert, onMarkAsRead, onDismiss }: AlertCardProps) {
  const navigate = useNavigate();
  const config = alertTypeConfig[alert.type];
  const Icon = config.icon;

  const handleViewEntity = () => {
    if (alert.client_id) {
      navigate(`/clients/${alert.client_id}`);
    } else if (alert.lead_id) {
      navigate(`/leads`);
    }
    if (!alert.read) {
      onMarkAsRead(alert.id);
    }
  };

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      !alert.read && 'border-l-4 border-l-primary',
      alert.dismissed && 'opacity-60'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            config.bgColor
          )}>
            <Icon className={cn('h-5 w-5', config.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn('text-xs', config.color)}>
                {config.label}
              </Badge>
              {!alert.read && (
                <Badge variant="default" className="text-xs">
                  Novo
                </Badge>
              )}
            </div>
            
            <p className={cn(
              'text-sm',
              !alert.read ? 'font-medium text-foreground' : 'text-muted-foreground'
            )}>
              {alert.message}
            </p>

            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(alert.created_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
              
              {alert.client && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {alert.client.name}
                </span>
              )}
              
              {alert.lead && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <UserPlus className="h-3 w-3" />
                  {alert.lead.name}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {(alert.client_id || alert.lead_id) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleViewEntity}
                title="Ver detalhes"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            
            {!alert.read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary"
                onClick={() => onMarkAsRead(alert.id)}
                title="Marcar como lido"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            
            {!alert.dismissed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onDismiss(alert.id)}
                title="Dispensar"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
