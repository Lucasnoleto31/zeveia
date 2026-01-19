import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useClientsChart, DashboardPeriodOptions } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';

interface ClientsChartProps {
  periodOptions?: DashboardPeriodOptions;
}

export function ClientsChart({ periodOptions }: ClientsChartProps) {
  const { data, isLoading } = useClientsChart(periodOptions);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Clientes Ativos</CardTitle>
          <CardDescription>Evolução mensal</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">👥</span>
          Clientes Ativos
        </CardTitle>
        <CardDescription>Evolução acumulada - Período selecionado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-sm text-primary font-bold">
                          {payload[0].value?.toLocaleString('pt-BR')} clientes
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="clientes"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
