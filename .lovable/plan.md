

## Pagina Wealth - Simulador de Carteira para Reuniao com Cliente

### Objetivo
Criar uma pagina dedicada para uso em reunioes com clientes investidores, no estilo BTG/XP, focada em **captacao de carteira, seguros e consorcios**. A pagina funciona 100% com inputs manuais (carteira hipotetica) e nao depende de dados do banco.

### Estrutura da Pagina (`/wealth`)

A pagina tera 4 abas com visual limpo e profissional para apresentar ao cliente:

---

#### Aba 1 - Cenarios Inteligentes
Interface para montar uma carteira hipotetica e simular cenarios:

**Inputs:**
- Patrimonio total do cliente (R$)
- Alocacao por classe de ativo via sliders (somando 100%):
  - Renda Fixa (CDI/Selic)
  - Acoes (Ibovespa)
  - Fundos Imobiliarios
  - Multimercado
  - Cambial (Dolar)
  - Seguros / Previdencia
  - Consorcios
- Aporte mensal (R$)
- Horizonte (anos): 1, 3, 5, 10, 20

**Outputs:**
- Patrimonio projetado ao final do horizonte
- Rendimento total em R$ e %
- Grafico de evolucao patrimonial ao longo do tempo (AreaChart)
- Comparativo: "Sua carteira vs Poupanca vs CDI 100%"

---

#### Aba 2 - Risco
Analise visual do perfil de risco da carteira montada:

**Visualizacoes:**
- Grafico de pizza com a alocacao por classe
- Score de risco da carteira (1 a 10) baseado no peso em renda variavel
- Classificacao: Conservador / Moderado / Arrojado / Agressivo
- Volatilidade estimada (desvio padrao anualizado simplificado)
- Drawdown maximo historico estimado por classe
- Sugestao de rebalanceamento baseada no perfil selecionado

**Perfis pre-definidos (botoes rapidos):**
- Conservador: 70% RF, 10% FII, 10% Multi, 5% Seguros, 5% Consorcio
- Moderado: 45% RF, 15% Acoes, 15% FII, 10% Multi, 5% Cambial, 5% Seguros, 5% Consorcio
- Arrojado: 25% RF, 30% Acoes, 15% FII, 15% Multi, 10% Cambial, 5% Seguros

---

#### Aba 3 - Projecoes
Simulacao de cenarios macroeconomicos e impacto na carteira:

**Cenarios de mercado (toggle/select):**
- Selic sobe para X% (input) - impacto positivo em RF, negativo em acoes
- Selic cai para X% - inverso
- Dolar sobe X% - impacto na parcela cambial
- Ibovespa sobe/cai X% - impacto na parcela de acoes
- Cenario estresse (tudo cai) - worst case

**Outputs:**
- Grafico com 3 linhas: Otimista / Base / Pessimista
- Tabela com projecao mes a mes para 12 meses
- Patrimonio final em cada cenario
- Cards destacando: melhor cenario, pior cenario, cenario base

**Premissas de retorno (valores default editaveis):**
- Renda Fixa: Selic atual (default 13.25%)
- Acoes: 12% a.a. historico
- FII: CDI + 2%
- Multimercado: CDI + 1%
- Cambial: 5% a.a.
- Seguros: protecao (sem retorno, custo estimado)
- Consorcios: valorizacao do bem (IPCA + 2%)

---

#### Aba 4 - Comparativos
Comparar diferentes estrategias de carteira lado a lado:

**Funcionalidade:**
- Ate 3 carteiras para comparar simultaneamente
- Botao "Adicionar Carteira" para criar uma nova alocacao
- Cada carteira tem nome editavel ("Carteira Atual", "Proposta Assessor", "Conservadora")

**Visualizacao:**
- Tabela comparativa com metricas:
  - Retorno projetado (1a, 3a, 5a)
  - Risco (score 1-10)
  - Volatilidade estimada
  - Patrimonio final projetado
  - Alocacao em seguros e consorcios
- Grafico de barras agrupadas (3 carteiras lado a lado)
- Grafico de linha sobreposto (evolucao das 3 carteiras no tempo)

---

### Arquivos a criar/modificar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/WealthSimulatorPage.tsx` | Pagina principal com as 4 abas e toda logica de simulacao |
| `src/hooks/useWealthSimulator.ts` | Hook com logica de calculo: juros compostos, risco, cenarios, comparativos |
| `src/components/layout/AppSidebar.tsx` | Adicionar "Wealth" no grupo Gestao com icone `TrendingUp` |
| `src/App.tsx` | Adicionar rota `/wealth` com lazy loading |

### Detalhes tecnicos

**Nenhuma tabela nova necessaria.** Tudo funciona com inputs manuais e calculos no frontend.

**Calculos principais no hook:**
- Juros compostos: `P * (1 + r/12)^(n*12) + PMT * ((1 + r/12)^(n*12) - 1) / (r/12)`
- Score de risco: media ponderada dos pesos de cada classe multiplicados por seu fator de risco (RF=1, Acoes=9, FII=5, Multi=6, Cambial=7, Seguros=2, Consorcios=3)
- Volatilidade: raiz quadrada da soma dos quadrados (peso * vol_classe)
- Cenarios: aplicar multiplicadores nos retornos base de cada classe

**Premissas editaveis:** o usuario pode alterar os retornos esperados de cada classe diretamente na interface (inputs com valores default)

**Visual:** seguir padrao do projeto - Cards, MetricCard, recharts para graficos, Tabs/Slider/Select do Radix UI. Cores consistentes por classe de ativo.

**Foco em captacao:** cada aba destaca a parcela de Seguros e Consorcios como diferencial, com cards especificos mostrando o valor de protecao e planejamento patrimonial.

