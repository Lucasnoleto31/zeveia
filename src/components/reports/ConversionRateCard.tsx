import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Clock, Users, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversionRateCardProps {
  totalLeads: number;
  convertedLeads: number;
  lostLeads: number;
  conversionRate: number;
  avgConversionDays: number;
}

export function ConversionRateCard({
  totalLeads,
  convertedLeads,
  lostLeads,
  conversionRate,
  avgConversionDays,
}: ConversionRateCardProps) {
  const activeLeads = totalLeads - convertedLeads - lostLeads;
  const isGoodRate = conversionRate >= 20;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Leads */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Leads</p>
              <p className="text-2xl font-bold">{totalLeads}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Converted */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Convertidos</p>
              <p className="text-2xl font-bold text-green-600">{convertedLeads}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lost */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Perdidos</p>
              <p className="text-2xl font-bold text-red-600">{lostLeads}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Rate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              isGoodRate ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'
            )}>
              {isGoodRate ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className={cn(
                'text-2xl font-bold',
                isGoodRate ? 'text-green-600' : 'text-yellow-600'
              )}>
                {conversionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full width - Avg Conversion Time & Progress */}
      <Card className="col-span-2 md:col-span-4">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio de Conversão</p>
                <p className="text-xl font-bold">
                  {avgConversionDays.toFixed(0)} dias
                </p>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Pipeline Ativo</span>
                <span className="font-medium">{activeLeads} leads em andamento</span>
              </div>
              <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-muted">
                <div 
                  className="bg-green-500 transition-all" 
                  style={{ width: `${totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0}%` }}
                />
                <div 
                  className="bg-blue-500 transition-all" 
                  style={{ width: `${totalLeads > 0 ? (activeLeads / totalLeads) * 100 : 0}%` }}
                />
                <div 
                  className="bg-red-500 transition-all" 
                  style={{ width: `${totalLeads > 0 ? (lostLeads / totalLeads) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Convertidos ({((convertedLeads / totalLeads) * 100 || 0).toFixed(0)}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Em andamento ({((activeLeads / totalLeads) * 100 || 0).toFixed(0)}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Perdidos ({((lostLeads / totalLeads) * 100 || 0).toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
