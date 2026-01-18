import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface LeadsPipelineProps {
  data: {
    novo: number;
    em_contato: number;
    troca_assessoria: number;
    convertido: number;
    perdido: number;
  };
}

export function LeadsPipeline({ data }: LeadsPipelineProps) {
  const total = data.novo + data.em_contato + data.troca_assessoria;
  
  const stages = [
    { key: 'novo', label: 'Novo', color: 'bg-blue-500', count: data.novo },
    { key: 'em_contato', label: 'Em Contato', color: 'bg-yellow-500', count: data.em_contato },
    { key: 'troca_assessoria', label: 'Troca Assessoria', color: 'bg-purple-500', count: data.troca_assessoria },
    { key: 'convertido', label: 'Convertido', color: 'bg-green-500', count: data.convertido },
    { key: 'perdido', label: 'Perdido', color: 'bg-red-500', count: data.perdido },
  ];

  const conversionRate = (data.convertido + data.perdido) > 0 
    ? ((data.convertido / (data.convertido + data.perdido)) * 100).toFixed(1)
    : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          Pipeline de Leads
        </CardTitle>
        <CardDescription>
          {total} leads ativos | Taxa de conversão: {conversionRate}%
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stages.map((stage) => (
          <div key={stage.key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{stage.label}</span>
              <span className="font-medium">{stage.count}</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${stage.color} transition-all`}
                style={{ 
                  width: `${total > 0 ? (stage.count / Math.max(...stages.map(s => s.count), 1)) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
