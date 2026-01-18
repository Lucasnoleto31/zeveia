import { useLocation } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/leads': 'Leads',
  '/clients': 'Clientes',
  '/partners': 'Parceiros',
  '/revenues': 'Receitas',
  '/contracts': 'Contratos',
  '/platforms': 'Custos de Plataformas',
  '/goals': 'Metas',
  '/alerts': 'Alertas',
  '/reports/funnel': 'Funil de Vendas',
  '/reports/performance': 'Performance',
  '/reports/roi': 'ROI Parceiros',
  '/settings': 'Configurações',
};

export default function ComingSoon() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Página';

  return (
    <MainLayout title={title}>
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
              <Construction className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>
              Esta página está em desenvolvimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Em breve você poderá acessar todas as funcionalidades de {title.toLowerCase()} aqui.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
