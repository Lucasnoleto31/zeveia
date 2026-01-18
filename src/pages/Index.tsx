import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  Target, 
  BarChart3, 
  LogOut, 
  Loader2,
  CheckCircle2
} from 'lucide-react';

export default function Index() {
  const { user, profile, role, isSocio, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Assessor CRM</h1>
            <p className="text-muted-foreground">Sistema de Gestão para Assessores</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <CardTitle className="text-xl">Autenticação funcionando!</CardTitle>
                  <CardDescription>Você está logado com sucesso</CardDescription>
                </div>
              </div>
              <Badge variant={isSocio ? 'default' : 'secondary'} className="text-sm">
                {isSocio ? '👔 Sócio' : '📊 Assessor'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{profile?.name || 'Carregando...'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">E-mail</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Papel</p>
                <p className="font-medium capitalize">{role || 'Carregando...'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ID do Usuário</p>
                <p className="font-mono text-sm">{user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Level Info */}
        <Card>
          <CardHeader>
            <CardTitle>Nível de Acesso</CardTitle>
            <CardDescription>
              {isSocio 
                ? 'Como Sócio, você tem acesso total ao sistema'
                : 'Como Assessor, você visualiza apenas seus próprios dados'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={`p-4 rounded-lg border ${isSocio ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'}`}>
                <h4 className="font-semibold flex items-center gap-2">
                  👔 Sócio
                  {isSocio && <Badge variant="outline" className="text-xs">Você</Badge>}
                </h4>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  <li>✓ Visualiza todos os clientes e leads</li>
                  <li>✓ Acessa dados de todos os assessores</li>
                  <li>✓ Gerencia configurações do sistema</li>
                  <li>✓ Controla metas e comissões</li>
                  <li>✓ Relatórios consolidados</li>
                </ul>
              </div>
              <div className={`p-4 rounded-lg border ${!isSocio ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'}`}>
                <h4 className="font-semibold flex items-center gap-2">
                  📊 Assessor
                  {!isSocio && <Badge variant="outline" className="text-xs">Você</Badge>}
                </h4>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  <li>✓ Visualiza apenas seus clientes</li>
                  <li>✓ Gerencia seus próprios leads</li>
                  <li>✓ Acompanha suas metas pessoais</li>
                  <li>✓ Registra receitas e contratos</li>
                  <li>✓ Relatórios individuais</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="text-center p-6">
            <Users className="h-8 w-8 mx-auto text-primary mb-2" />
            <h3 className="font-semibold">Clientes</h3>
            <p className="text-sm text-muted-foreground">PF e PJ com visão 360°</p>
          </Card>
          <Card className="text-center p-6">
            <TrendingUp className="h-8 w-8 mx-auto text-primary mb-2" />
            <h3 className="font-semibold">Leads</h3>
            <p className="text-sm text-muted-foreground">Pipeline Kanban</p>
          </Card>
          <Card className="text-center p-6">
            <Target className="h-8 w-8 mx-auto text-primary mb-2" />
            <h3 className="font-semibold">Metas</h3>
            <p className="text-sm text-muted-foreground">Acompanhamento</p>
          </Card>
          <Card className="text-center p-6">
            <BarChart3 className="h-8 w-8 mx-auto text-primary mb-2" />
            <h3 className="font-semibold">Relatórios</h3>
            <p className="text-sm text-muted-foreground">Analytics</p>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">🚀 Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              A autenticação está funcionando! Para continuar a implementação das funcionalidades 
              (Dashboard, Leads, Clientes, Receitas, etc.), basta solicitar.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
