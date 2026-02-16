import { useState, useMemo } from 'react';

export interface Allocation {
  rendaFixa: number;
  acoes: number;
  fii: number;
  multimercado: number;
  cambial: number;
  seguros: number;
  consorcios: number;
}

export interface Premissas {
  selic: number;
  acoes: number;
  fii: number;
  multimercado: number;
  cambial: number;
  seguros: number;
  consorcios: number;
  ipca: number;
  poupanca: number;
}

export interface Portfolio {
  id: string;
  name: string;
  allocation: Allocation;
}

export interface ScenarioParams {
  selicTarget: number;
  dolarChange: number;
  ibovChange: number;
}

const DEFAULT_PREMISSAS: Premissas = {
  selic: 13.25,
  acoes: 12,
  fii: 15.25, // CDI + 2
  multimercado: 14.25, // CDI + 1
  cambial: 5,
  seguros: -1.5, // custo estimado
  consorcios: 6.5, // IPCA + 2
  ipca: 4.5,
  poupanca: 7.5,
};

const DEFAULT_ALLOCATION: Allocation = {
  rendaFixa: 40,
  acoes: 15,
  fii: 15,
  multimercado: 10,
  cambial: 5,
  seguros: 10,
  consorcios: 5,
};

const RISK_FACTORS: Record<keyof Allocation, number> = {
  rendaFixa: 1,
  acoes: 9,
  fii: 5,
  multimercado: 6,
  cambial: 7,
  seguros: 2,
  consorcios: 3,
};

const VOLATILITY: Record<keyof Allocation, number> = {
  rendaFixa: 2,
  acoes: 25,
  fii: 12,
  multimercado: 8,
  cambial: 15,
  seguros: 1,
  consorcios: 3,
};

const DRAWDOWN: Record<keyof Allocation, number> = {
  rendaFixa: -2,
  acoes: -45,
  fii: -25,
  multimercado: -15,
  cambial: -20,
  seguros: 0,
  consorcios: -5,
};

export const ASSET_LABELS: Record<keyof Allocation, string> = {
  rendaFixa: 'Renda Fixa',
  acoes: 'Ações',
  fii: 'Fundos Imobiliários',
  multimercado: 'Multimercado',
  cambial: 'Câmbio (Dólar)',
  seguros: 'Seguros / Previdência',
  consorcios: 'Consórcios',
};

export const ASSET_COLORS: Record<keyof Allocation, string> = {
  rendaFixa: 'hsl(221, 83%, 53%)',
  acoes: 'hsl(14, 90%, 58%)',
  fii: 'hsl(142, 71%, 45%)',
  multimercado: 'hsl(262, 83%, 58%)',
  cambial: 'hsl(47, 96%, 53%)',
  seguros: 'hsl(199, 89%, 48%)',
  consorcios: 'hsl(339, 90%, 51%)',
};

export const PROFILE_PRESETS: Record<string, { label: string; allocation: Allocation }> = {
  conservador: {
    label: 'Conservador',
    allocation: { rendaFixa: 70, acoes: 0, fii: 10, multimercado: 10, cambial: 0, seguros: 5, consorcios: 5 },
  },
  moderado: {
    label: 'Moderado',
    allocation: { rendaFixa: 45, acoes: 15, fii: 15, multimercado: 10, cambial: 5, seguros: 5, consorcios: 5 },
  },
  arrojado: {
    label: 'Arrojado',
    allocation: { rendaFixa: 25, acoes: 30, fii: 15, multimercado: 15, cambial: 10, seguros: 5, consorcios: 0 },
  },
};

function getReturn(alloc: Allocation, premissas: Premissas): number {
  return (
    (alloc.rendaFixa / 100) * premissas.selic +
    (alloc.acoes / 100) * premissas.acoes +
    (alloc.fii / 100) * premissas.fii +
    (alloc.multimercado / 100) * premissas.multimercado +
    (alloc.cambial / 100) * premissas.cambial +
    (alloc.seguros / 100) * premissas.seguros +
    (alloc.consorcios / 100) * premissas.consorcios
  );
}

function projectWealth(
  patrimony: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): number[] {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  const result: number[] = [patrimony];
  let current = patrimony;
  for (let i = 1; i <= months; i++) {
    current = current * (1 + monthlyRate) + monthlyContribution;
    result.push(current);
  }
  return result;
}

export function useWealthSimulator() {
  const [patrimony, setPatrimony] = useState(1000000);
  const [monthlyContribution, setMonthlyContribution] = useState(5000);
  const [horizon, setHorizon] = useState(5);
  const [allocation, setAllocation] = useState<Allocation>(DEFAULT_ALLOCATION);
  const [premissas, setPremissas] = useState<Premissas>(DEFAULT_PREMISSAS);
  const [scenario, setScenario] = useState<ScenarioParams>({
    selicTarget: 13.25,
    dolarChange: 0,
    ibovChange: 0,
  });
  const [portfolios, setPortfolios] = useState<Portfolio[]>([
    { id: '1', name: 'Carteira Atual', allocation: { ...DEFAULT_ALLOCATION } },
  ]);

  const totalAllocation = useMemo(
    () => Object.values(allocation).reduce((s, v) => s + v, 0),
    [allocation]
  );

  const annualReturn = useMemo(() => getReturn(allocation, premissas), [allocation, premissas]);

  const riskScore = useMemo(() => {
    let score = 0;
    (Object.keys(allocation) as (keyof Allocation)[]).forEach((k) => {
      score += (allocation[k] / 100) * RISK_FACTORS[k];
    });
    return Math.round(score * 10) / 10;
  }, [allocation]);

  const riskClassification = useMemo(() => {
    if (riskScore <= 3) return 'Conservador';
    if (riskScore <= 5) return 'Moderado';
    if (riskScore <= 7) return 'Arrojado';
    return 'Agressivo';
  }, [riskScore]);

  const volatility = useMemo(() => {
    let sum = 0;
    (Object.keys(allocation) as (keyof Allocation)[]).forEach((k) => {
      sum += ((allocation[k] / 100) * VOLATILITY[k]) ** 2;
    });
    return Math.round(Math.sqrt(sum) * 100) / 100;
  }, [allocation]);

  const maxDrawdown = useMemo(() => {
    let dd = 0;
    (Object.keys(allocation) as (keyof Allocation)[]).forEach((k) => {
      dd += (allocation[k] / 100) * DRAWDOWN[k];
    });
    return Math.round(dd * 100) / 100;
  }, [allocation]);

  const projection = useMemo(
    () => projectWealth(patrimony, monthlyContribution, annualReturn, horizon),
    [patrimony, monthlyContribution, annualReturn, horizon]
  );

  const savingsProjection = useMemo(
    () => projectWealth(patrimony, monthlyContribution, premissas.poupanca, horizon),
    [patrimony, monthlyContribution, premissas.poupanca, horizon]
  );

  const cdiProjection = useMemo(
    () => projectWealth(patrimony, monthlyContribution, premissas.selic, horizon),
    [patrimony, monthlyContribution, premissas.selic, horizon]
  );

  // Scenario projections (optimistic / base / pessimistic)
  const scenarioProjections = useMemo(() => {
    const selicDiff = scenario.selicTarget - premissas.selic;
    const makeAdjusted = (mult: number) => {
      const adj: Premissas = { ...premissas };
      adj.selic = scenario.selicTarget;
      adj.fii = adj.selic + 2;
      adj.multimercado = adj.selic + 1;
      adj.acoes = premissas.acoes + scenario.ibovChange * mult - selicDiff * 0.5 * mult;
      adj.cambial = premissas.cambial + scenario.dolarChange * mult;
      return adj;
    };

    const optimistic = getReturn(allocation, makeAdjusted(1.3));
    const base = getReturn(allocation, makeAdjusted(1));
    const pessimistic = getReturn(allocation, makeAdjusted(0.5));
    const stress = getReturn(allocation, {
      ...premissas,
      selic: premissas.selic - 2,
      acoes: -15,
      fii: -5,
      cambial: -10,
      multimercado: -3,
      consorcios: premissas.ipca,
      seguros: premissas.seguros,
    });

    return {
      optimistic: projectWealth(patrimony, monthlyContribution, optimistic, 1),
      base: projectWealth(patrimony, monthlyContribution, base, 1),
      pessimistic: projectWealth(patrimony, monthlyContribution, pessimistic, 1),
      stress: projectWealth(patrimony, monthlyContribution, stress, 1),
      rates: { optimistic, base, pessimistic, stress },
    };
  }, [allocation, premissas, scenario, patrimony, monthlyContribution]);

  // Comparison helpers
  const getPortfolioMetrics = (alloc: Allocation) => {
    const ret = getReturn(alloc, premissas);
    let rs = 0, vol = 0;
    (Object.keys(alloc) as (keyof Allocation)[]).forEach((k) => {
      rs += (alloc[k] / 100) * RISK_FACTORS[k];
      vol += ((alloc[k] / 100) * VOLATILITY[k]) ** 2;
    });
    const proj1 = projectWealth(patrimony, monthlyContribution, ret, 1);
    const proj3 = projectWealth(patrimony, monthlyContribution, ret, 3);
    const proj5 = projectWealth(patrimony, monthlyContribution, ret, 5);
    return {
      annualReturn: ret,
      riskScore: Math.round(rs * 10) / 10,
      volatility: Math.round(Math.sqrt(vol) * 100) / 100,
      projected1y: proj1[proj1.length - 1],
      projected3y: proj3[proj3.length - 1],
      projected5y: proj5[proj5.length - 1],
      segurosPercent: alloc.seguros,
      consorciosPercent: alloc.consorcios,
    };
  };

  const addPortfolio = () => {
    if (portfolios.length >= 3) return;
    setPortfolios((p) => [
      ...p,
      {
        id: String(Date.now()),
        name: `Carteira ${p.length + 1}`,
        allocation: { ...DEFAULT_ALLOCATION },
      },
    ]);
  };

  const removePortfolio = (id: string) => {
    setPortfolios((p) => p.filter((x) => x.id !== id));
  };

  const updatePortfolio = (id: string, updates: Partial<Portfolio>) => {
    setPortfolios((p) => p.map((x) => (x.id === id ? { ...x, ...updates } : x)));
  };

  const setPreset = (preset: keyof typeof PROFILE_PRESETS) => {
    setAllocation({ ...PROFILE_PRESETS[preset].allocation });
  };

  const updateAllocationKey = (key: keyof Allocation, value: number) => {
    setAllocation((prev) => ({ ...prev, [key]: value }));
  };

  return {
    patrimony, setPatrimony,
    monthlyContribution, setMonthlyContribution,
    horizon, setHorizon,
    allocation, setAllocation, updateAllocationKey,
    premissas, setPremissas,
    totalAllocation,
    annualReturn,
    riskScore, riskClassification,
    volatility, maxDrawdown,
    projection, savingsProjection, cdiProjection,
    scenario, setScenario, scenarioProjections,
    portfolios, addPortfolio, removePortfolio, updatePortfolio,
    getPortfolioMetrics,
    setPreset,
  };
}
