import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  useWealthSimulator,
  ASSET_LABELS,
  ASSET_COLORS,
  PROFILE_PRESETS,
  type Allocation,
} from '@/hooks/useWealthSimulator';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar, LineChart, Line,
} from 'recharts';
import { TrendingUp, Shield, BarChart3, GitCompare, AlertTriangle, CheckCircle } from 'lucide-react';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const pct = (v: number) => `${v.toFixed(2)}%`;

export default function WealthSimulatorPage() {
  const sim = useWealthSimulator();
  const keys = Object.keys(sim.allocation) as (keyof Allocation)[];

  // Chart data for projection
  const projectionData = sim.projection.map((v, i) => ({
    month: i,
    'Sua Carteira': Math.round(v),
    Poupança: Math.round(sim.savingsProjection[i] ?? 0),
    'CDI 100%': Math.round(sim.cdiProjection[i] ?? 0),
  }));

  // Pie data
  const pieData = keys
    .filter((k) => sim.allocation[k] > 0)
    .map((k) => ({ name: ASSET_LABELS[k], value: sim.allocation[k], color: ASSET_COLORS[k] }));

  // Scenario chart data (12 months)
  const scenarioData = Array.from({ length: 13 }, (_, i) => ({
    month: i,
    Otimista: Math.round(sim.scenarioProjections.optimistic[i] ?? 0),
    Base: Math.round(sim.scenarioProjections.base[i] ?? 0),
    Pessimista: Math.round(sim.scenarioProjections.pessimistic[i] ?? 0),
  }));

  const finalValue = sim.projection[sim.projection.length - 1];
  const totalInvested = sim.patrimony + sim.monthlyContribution * sim.horizon * 12;
  const rendimento = finalValue - totalInvested;

  return (
    <MainLayout title="Wealth Simulator">
      <div className="space-y-6">
        {/* Inputs globais */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label>Patrimônio Total (R$)</Label>
                <Input
                  type="number"
                  value={sim.patrimony}
                  onChange={(e) => sim.setPatrimony(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Aporte Mensal (R$)</Label>
                <Input
                  type="number"
                  value={sim.monthlyContribution}
                  onChange={(e) => sim.setMonthlyContribution(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Horizonte (anos)</Label>
                <div className="flex gap-2 mt-1">
                  {[1, 3, 5, 10, 20].map((y) => (
                    <Button
                      key={y}
                      size="sm"
                      variant={sim.horizon === y ? 'default' : 'outline'}
                      onClick={() => sim.setHorizon(y)}
                    >
                      {y}a
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="cenarios" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cenarios" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Cenários
            </TabsTrigger>
            <TabsTrigger value="risco" className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Risco
            </TabsTrigger>
            <TabsTrigger value="projecoes" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Projeções
            </TabsTrigger>
            <TabsTrigger value="comparativos" className="flex items-center gap-2">
              <GitCompare className="h-4 w-4" /> Comparativos
            </TabsTrigger>
          </TabsList>

          {/* ===== ABA 1 - CENÁRIOS ===== */}
          <TabsContent value="cenarios" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sliders */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">Alocação por Classe</CardTitle>
                  <CardDescription>
                    Total: <span className={sim.totalAllocation === 100 ? 'text-green-600 font-bold' : 'text-destructive font-bold'}>{sim.totalAllocation}%</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {keys.map((k) => (
                    <div key={k}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{ASSET_LABELS[k]}</span>
                        <span className="font-medium">{sim.allocation[k]}%</span>
                      </div>
                      <Slider
                        value={[sim.allocation[k]]}
                        onValueChange={([v]) => sim.updateAllocationKey(k, v)}
                        max={100}
                        step={1}
                      />
                    </div>
                  ))}
                  <Separator />
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(PROFILE_PRESETS).map(([key, p]) => (
                      <Button key={key} size="sm" variant="outline" onClick={() => sim.setPreset(key as any)}>
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">Patrimônio Projetado</p>
                      <p className="text-2xl font-bold text-primary">{fmt(finalValue)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">Rendimento Total</p>
                      <p className="text-2xl font-bold text-green-600">{fmt(rendimento)}</p>
                      <p className="text-xs text-muted-foreground">{pct((rendimento / totalInvested) * 100)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">Retorno Anual</p>
                      <p className="text-2xl font-bold">{pct(sim.annualReturn)}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Evolução Patrimonial</CardTitle>
                    <CardDescription>Sua Carteira vs Poupança vs CDI 100%</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickFormatter={(m) => `${Math.floor(m / 12)}a`} />
                        <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                        <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={(m) => `Mês ${m}`} />
                        <Area type="monotone" dataKey="Sua Carteira" stroke="hsl(221, 83%, 53%)" fill="hsl(221, 83%, 53%)" fillOpacity={0.15} strokeWidth={2} />
                        <Area type="monotone" dataKey="CDI 100%" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="5 5" />
                        <Area type="monotone" dataKey="Poupança" stroke="hsl(47, 96%, 53%)" fill="hsl(47, 96%, 53%)" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Insurance & Consórcio highlight */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border-l-4" style={{ borderLeftColor: ASSET_COLORS.seguros }}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-5 w-5" style={{ color: ASSET_COLORS.seguros }} />
                        <p className="font-semibold">Seguros & Previdência</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {sim.allocation.seguros}% da carteira dedicados à proteção patrimonial e planejamento sucessório.
                        Valor alocado: <strong>{fmt(sim.patrimony * sim.allocation.seguros / 100)}</strong>
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4" style={{ borderLeftColor: ASSET_COLORS.consorcios }}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5" style={{ color: ASSET_COLORS.consorcios }} />
                        <p className="font-semibold">Consórcios</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {sim.allocation.consorcios}% para aquisição planejada de bens com valorização projetada de IPCA+2%.
                        Valor alocado: <strong>{fmt(sim.patrimony * sim.allocation.consorcios / 100)}</strong>
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ===== ABA 2 - RISCO ===== */}
          <TabsContent value="risco" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Alocação da Carteira</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, value }) => `${name}: ${value}%`}>
                        {pieData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Score de Risco</p>
                        <p className="text-4xl font-bold">{sim.riskScore}<span className="text-lg text-muted-foreground">/10</span></p>
                      </div>
                      <Badge variant={sim.riskScore <= 3 ? 'secondary' : sim.riskScore <= 5 ? 'default' : 'destructive'} className="text-base px-4 py-1">
                        {sim.riskClassification}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">Volatilidade Estimada</p>
                      <p className="text-2xl font-bold">{pct(sim.volatility)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">Drawdown Máx. Estimado</p>
                      <p className="text-2xl font-bold text-destructive">{pct(sim.maxDrawdown)}</p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader><CardTitle className="text-base">Drawdown por Classe</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {keys.filter((k) => sim.allocation[k] > 0).map((k) => (
                        <div key={k} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: ASSET_COLORS[k] }} />
                            {ASSET_LABELS[k]}
                          </span>
                          <span className="font-mono text-destructive">
                            {k === 'seguros' ? '0%' : `${[-2, -45, -25, -15, -20, 0, -5][keys.indexOf(k)]}%`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4" style={{ borderLeftColor: ASSET_COLORS.seguros }}>
                  <CardContent className="pt-6">
                    <p className="text-sm">
                      <strong>💡 Proteção:</strong> A parcela em Seguros ({sim.allocation.seguros}%) e Consórcios ({sim.allocation.consorcios}%) atua como amortecedor nos cenários de estresse, reduzindo o drawdown geral da carteira.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Perfis Rápidos</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-4 flex-wrap">
                  {Object.entries(PROFILE_PRESETS).map(([key, p]) => (
                    <Button key={key} variant="outline" onClick={() => sim.setPreset(key as any)} className="flex-col h-auto py-3">
                      <span className="font-semibold">{p.label}</span>
                      <span className="text-xs text-muted-foreground">
                        RF {p.allocation.rendaFixa}% · Ações {p.allocation.acoes}%
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== ABA 3 - PROJEÇÕES ===== */}
          <TabsContent value="projecoes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">Cenários de Mercado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Selic alvo (%)</Label>
                    <Input type="number" step={0.25} value={sim.scenario.selicTarget} onChange={(e) => sim.setScenario((s) => ({ ...s, selicTarget: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label>Variação Dólar (%)</Label>
                    <Input type="number" step={1} value={sim.scenario.dolarChange} onChange={(e) => sim.setScenario((s) => ({ ...s, dolarChange: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label>Variação Ibovespa (%)</Label>
                    <Input type="number" step={1} value={sim.scenario.ibovChange} onChange={(e) => sim.setScenario((s) => ({ ...s, ibovChange: Number(e.target.value) }))} />
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Premissas editáveis (% a.a.)</p>
                    {(['selic', 'acoes', 'fii', 'multimercado', 'cambial', 'consorcios'] as const).map((k) => (
                      <div key={k} className="flex items-center gap-2 mb-2">
                        <Label className="w-28 text-xs">{k === 'selic' ? 'Renda Fixa' : k === 'acoes' ? 'Ações' : k === 'fii' ? 'FII' : k === 'multimercado' ? 'Multi' : k === 'cambial' ? 'Câmbio' : 'Consórcio'}</Label>
                        <Input type="number" step={0.25} className="h-8 text-xs" value={sim.premissas[k]} onChange={(e) => sim.setPremissas((p) => ({ ...p, [k]: Number(e.target.value) }))} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="border-t-4 border-t-green-500">
                    <CardContent className="pt-6 text-center">
                      <p className="text-xs text-muted-foreground">Otimista</p>
                      <p className="text-xl font-bold text-green-600">{fmt(sim.scenarioProjections.optimistic[12] ?? 0)}</p>
                      <p className="text-xs">{pct(sim.scenarioProjections.rates.optimistic)} a.a.</p>
                    </CardContent>
                  </Card>
                  <Card className="border-t-4 border-t-blue-500">
                    <CardContent className="pt-6 text-center">
                      <p className="text-xs text-muted-foreground">Base</p>
                      <p className="text-xl font-bold">{fmt(sim.scenarioProjections.base[12] ?? 0)}</p>
                      <p className="text-xs">{pct(sim.scenarioProjections.rates.base)} a.a.</p>
                    </CardContent>
                  </Card>
                  <Card className="border-t-4 border-t-red-500">
                    <CardContent className="pt-6 text-center">
                      <p className="text-xs text-muted-foreground">Pessimista</p>
                      <p className="text-xl font-bold text-destructive">{fmt(sim.scenarioProjections.pessimistic[12] ?? 0)}</p>
                      <p className="text-xs">{pct(sim.scenarioProjections.rates.pessimistic)} a.a.</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader><CardTitle className="text-base">Projeção 12 Meses por Cenário</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={scenarioData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickFormatter={(m) => `M${m}`} />
                        <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(2)}M`} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Line type="monotone" dataKey="Otimista" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Base" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Pessimista" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" /> Cenário de Estresse
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      Queda generalizada: Ações -15%, FII -5%, Câmbio -10%, Multi -3%, Selic -2p.p.
                    </p>
                    <p className="text-lg font-bold text-destructive">
                      Patrimônio em 12m: {fmt(sim.scenarioProjections.stress[12] ?? 0)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ===== ABA 4 - COMPARATIVOS ===== */}
          <TabsContent value="comparativos" className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <Button onClick={sim.addPortfolio} disabled={sim.portfolios.length >= 3}>
                + Adicionar Carteira
              </Button>
              <p className="text-sm text-muted-foreground">{sim.portfolios.length}/3 carteiras</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {sim.portfolios.map((p) => {
                const metrics = sim.getPortfolioMetrics(p.allocation);
                return (
                  <Card key={p.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Input
                          className="font-semibold text-base border-none p-0 h-auto focus-visible:ring-0"
                          value={p.name}
                          onChange={(e) => sim.updatePortfolio(p.id, { name: e.target.value })}
                        />
                        {sim.portfolios.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => sim.removePortfolio(p.id)}>✕</Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {keys.map((k) => (
                        <div key={k}>
                          <div className="flex justify-between text-xs mb-1">
                            <span>{ASSET_LABELS[k]}</span>
                            <span>{p.allocation[k]}%</span>
                          </div>
                          <Slider
                            value={[p.allocation[k]]}
                            onValueChange={([v]) =>
                              sim.updatePortfolio(p.id, {
                                allocation: { ...p.allocation, [k]: v },
                              })
                            }
                            max={100}
                            step={1}
                          />
                        </div>
                      ))}
                      <Separator />
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between"><span>Retorno 1a:</span><strong>{fmt(metrics.projected1y)}</strong></div>
                        <div className="flex justify-between"><span>Retorno 3a:</span><strong>{fmt(metrics.projected3y)}</strong></div>
                        <div className="flex justify-between"><span>Retorno 5a:</span><strong>{fmt(metrics.projected5y)}</strong></div>
                        <div className="flex justify-between"><span>Risco:</span><strong>{metrics.riskScore}/10</strong></div>
                        <div className="flex justify-between"><span>Volatilidade:</span><strong>{pct(metrics.volatility)}</strong></div>
                        <div className="flex justify-between"><span>Seguros:</span><strong>{metrics.segurosPercent}%</strong></div>
                        <div className="flex justify-between"><span>Consórcios:</span><strong>{metrics.consorciosPercent}%</strong></div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {sim.portfolios.length >= 2 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Evolução Comparativa (5 anos)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" type="number" domain={[0, 60]} tickFormatter={(m) => `${Math.floor(m / 12)}a`} />
                      <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      {sim.portfolios.map((p, idx) => {
                        const ret = sim.getPortfolioMetrics(p.allocation).annualReturn;
                        const monthlyRate = ret / 100 / 12;
                        const data = Array.from({ length: 61 }, (_, i) => {
                          let v = sim.patrimony;
                          for (let m = 0; m < i; m++) v = v * (1 + monthlyRate) + sim.monthlyContribution;
                          return { month: i, value: Math.round(v) };
                        });
                        const colors = ['hsl(221, 83%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(262, 83%, 58%)'];
                        return (
                          <Line key={p.id} data={data} dataKey="value" name={p.name} stroke={colors[idx]} strokeWidth={2} dot={false} />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
