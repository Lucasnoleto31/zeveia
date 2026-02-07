-- ============================================================
-- Migration: Macro Events Calendar
-- Created: 2026-02-06
-- Description: Table for tracking macroeconomic events relevant
--              to B3 traders (FOMC, Copom, Payroll, IPCA, etc.)
-- ============================================================

-- Create event_type enum
CREATE TYPE public.macro_event_type AS ENUM (
  'fomc',
  'copom',
  'payroll',
  'cpi',
  'ipca',
  'pib',
  'earnings',
  'options_expiry',
  'contract_rollover',
  'other'
);

-- Create impact_level enum
CREATE TYPE public.impact_level AS ENUM (
  'high',
  'medium',
  'low'
);

-- Create macro_events table
CREATE TABLE public.macro_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_type public.macro_event_type NOT NULL,
  event_date DATE NOT NULL,
  description TEXT,
  impact_level public.impact_level NOT NULL DEFAULT 'medium',
  country TEXT NOT NULL DEFAULT 'BR',
  recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.macro_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Any authenticated user can read macro events
CREATE POLICY "Authenticated users can view macro events"
  ON public.macro_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Only sócios can insert macro events
CREATE POLICY "Socios can insert macro events"
  ON public.macro_events
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_socio());

-- Only sócios can update macro events
CREATE POLICY "Socios can update macro events"
  ON public.macro_events
  FOR UPDATE
  TO authenticated
  USING (public.is_socio())
  WITH CHECK (public.is_socio());

-- Only sócios can delete macro events
CREATE POLICY "Socios can delete macro events"
  ON public.macro_events
  FOR DELETE
  TO authenticated
  USING (public.is_socio());

-- Create index for efficient date-range queries
CREATE INDEX idx_macro_events_date ON public.macro_events (event_date);
CREATE INDEX idx_macro_events_type ON public.macro_events (event_type);

-- ============================================================
-- SEED DATA: 2026 Macro Events
-- Sources:
--   FOMC: federalreserve.gov/monetarypolicy/fomccalendars.htm
--   Copom: bcb.gov.br (8 meetings in 2026)
--   Payroll: bls.gov/schedule/news_release/empsit.htm
--   IPCA: ibge.gov.br/calendario-indicadores-novoportal.html
--   B3 Options Expiry: 3rd Monday of each month (index options)
--   Futures Rollover: Bi-monthly (even months), typically near expiry
-- ============================================================

INSERT INTO public.macro_events (name, event_type, event_date, description, impact_level, country, recurring) VALUES

-- ============================================================
-- FOMC Meetings 2026 (8 meetings - decision day = 2nd day)
-- Source: federalreserve.gov
-- ============================================================
('FOMC - Janeiro', 'fomc', '2026-01-28', 'Decisão de juros do Federal Reserve (reunião 27-28 jan)', 'high', 'US', true),
('FOMC - Março', 'fomc', '2026-03-18', 'Decisão de juros do Federal Reserve (reunião 17-18 mar) - Com projeções econômicas (SEP)', 'high', 'US', true),
('FOMC - Abril', 'fomc', '2026-04-29', 'Decisão de juros do Federal Reserve (reunião 28-29 abr)', 'high', 'US', true),
('FOMC - Junho', 'fomc', '2026-06-17', 'Decisão de juros do Federal Reserve (reunião 16-17 jun) - Com projeções econômicas (SEP)', 'high', 'US', true),
('FOMC - Julho', 'fomc', '2026-07-29', 'Decisão de juros do Federal Reserve (reunião 28-29 jul)', 'high', 'US', true),
('FOMC - Setembro', 'fomc', '2026-09-16', 'Decisão de juros do Federal Reserve (reunião 15-16 set) - Com projeções econômicas (SEP)', 'high', 'US', true),
('FOMC - Outubro', 'fomc', '2026-10-28', 'Decisão de juros do Federal Reserve (reunião 27-28 out)', 'high', 'US', true),
('FOMC - Dezembro', 'fomc', '2026-12-09', 'Decisão de juros do Federal Reserve (reunião 8-9 dez) - Com projeções econômicas (SEP)', 'high', 'US', true),

-- ============================================================
-- Copom Meetings 2026 (8 meetings - decision day = 2nd day, Wednesday)
-- Source: bcb.gov.br
-- ============================================================
('Copom - Janeiro', 'copom', '2026-01-28', 'Decisão da taxa Selic (reunião 27-28 jan)', 'high', 'BR', true),
('Copom - Março', 'copom', '2026-03-18', 'Decisão da taxa Selic (reunião 17-18 mar)', 'high', 'BR', true),
('Copom - Abril', 'copom', '2026-04-29', 'Decisão da taxa Selic (reunião 28-29 abr)', 'high', 'BR', true),
('Copom - Junho', 'copom', '2026-06-17', 'Decisão da taxa Selic (reunião 16-17 jun)', 'high', 'BR', true),
('Copom - Agosto', 'copom', '2026-08-05', 'Decisão da taxa Selic (reunião 4-5 ago)', 'high', 'BR', true),
('Copom - Setembro', 'copom', '2026-09-16', 'Decisão da taxa Selic (reunião 15-16 set)', 'high', 'BR', true),
('Copom - Novembro', 'copom', '2026-11-04', 'Decisão da taxa Selic (reunião 3-4 nov)', 'high', 'BR', true),
('Copom - Dezembro', 'copom', '2026-12-09', 'Decisão da taxa Selic (reunião 8-9 dez)', 'high', 'BR', true),

-- ============================================================
-- Super Quartas 2026 (FOMC + Copom no mesmo dia)
-- Jan 28, Mar 18, Jun 17, Set 16, Dez 9
-- ============================================================
-- (Already covered by individual FOMC and Copom entries above.
--  Adding markers for awareness)
('Super Quarta - Janeiro', 'other', '2026-01-28', 'FOMC + Copom decidem juros no mesmo dia', 'high', 'BR', false),
('Super Quarta - Março', 'other', '2026-03-18', 'FOMC + Copom decidem juros no mesmo dia', 'high', 'BR', false),
('Super Quarta - Junho', 'other', '2026-06-17', 'FOMC + Copom decidem juros no mesmo dia', 'high', 'BR', false),
('Super Quarta - Setembro', 'other', '2026-09-16', 'FOMC + Copom decidem juros no mesmo dia', 'high', 'BR', false),
('Super Quarta - Dezembro', 'other', '2026-12-09', 'FOMC + Copom decidem juros no mesmo dia', 'high', 'BR', false),

-- ============================================================
-- US Non-Farm Payroll 2026 (Employment Situation)
-- Source: bls.gov/schedule/news_release/empsit.htm
-- ============================================================
('Payroll - Janeiro (ref. Dez/25)', 'payroll', '2026-01-09', 'Non-Farm Payroll EUA - dados de dezembro/2025', 'high', 'US', true),
('Payroll - Fevereiro (ref. Jan/26)', 'payroll', '2026-02-11', 'Non-Farm Payroll EUA - dados de janeiro/2026 + revisão anual', 'high', 'US', true),
('Payroll - Março (ref. Fev/26)', 'payroll', '2026-03-06', 'Non-Farm Payroll EUA - dados de fevereiro/2026', 'high', 'US', true),
('Payroll - Abril (ref. Mar/26)', 'payroll', '2026-04-03', 'Non-Farm Payroll EUA - dados de março/2026', 'high', 'US', true),
('Payroll - Maio (ref. Abr/26)', 'payroll', '2026-05-08', 'Non-Farm Payroll EUA - dados de abril/2026', 'high', 'US', true),
('Payroll - Junho (ref. Mai/26)', 'payroll', '2026-06-05', 'Non-Farm Payroll EUA - dados de maio/2026', 'high', 'US', true),
('Payroll - Julho (ref. Jun/26)', 'payroll', '2026-07-02', 'Non-Farm Payroll EUA - dados de junho/2026', 'high', 'US', true),
('Payroll - Agosto (ref. Jul/26)', 'payroll', '2026-08-07', 'Non-Farm Payroll EUA - dados de julho/2026', 'high', 'US', true),
('Payroll - Setembro (ref. Ago/26)', 'payroll', '2026-09-04', 'Non-Farm Payroll EUA - dados de agosto/2026', 'high', 'US', true),
('Payroll - Outubro (ref. Set/26)', 'payroll', '2026-10-02', 'Non-Farm Payroll EUA - dados de setembro/2026', 'high', 'US', true),
('Payroll - Novembro (ref. Out/26)', 'payroll', '2026-11-06', 'Non-Farm Payroll EUA - dados de outubro/2026', 'high', 'US', true),
('Payroll - Dezembro (ref. Nov/26)', 'payroll', '2026-12-04', 'Non-Farm Payroll EUA - dados de novembro/2026', 'high', 'US', true),

-- ============================================================
-- IPCA 2026 (Divulgação mensal pelo IBGE)
-- Source: ibge.gov.br/calendario-indicadores-novoportal.html
-- ============================================================
('IPCA - Janeiro (ref. Dez/25)', 'ipca', '2026-01-09', 'IPCA referência dezembro/2025', 'medium', 'BR', true),
('IPCA - Fevereiro (ref. Jan/26)', 'ipca', '2026-02-10', 'IPCA referência janeiro/2026', 'medium', 'BR', true),
('IPCA - Março (ref. Fev/26)', 'ipca', '2026-03-12', 'IPCA referência fevereiro/2026', 'medium', 'BR', true),
('IPCA - Abril (ref. Mar/26)', 'ipca', '2026-04-10', 'IPCA referência março/2026', 'medium', 'BR', true),
('IPCA - Maio (ref. Abr/26)', 'ipca', '2026-05-12', 'IPCA referência abril/2026', 'medium', 'BR', true),
('IPCA - Junho (ref. Mai/26)', 'ipca', '2026-06-12', 'IPCA referência maio/2026', 'medium', 'BR', true),
('IPCA - Julho (ref. Jun/26)', 'ipca', '2026-07-10', 'IPCA referência junho/2026', 'medium', 'BR', true),
('IPCA - Agosto (ref. Jul/26)', 'ipca', '2026-08-11', 'IPCA referência julho/2026', 'medium', 'BR', true),
('IPCA - Setembro (ref. Ago/26)', 'ipca', '2026-09-11', 'IPCA referência agosto/2026', 'medium', 'BR', true),
('IPCA - Outubro (ref. Set/26)', 'ipca', '2026-10-09', 'IPCA referência setembro/2026', 'medium', 'BR', true),
('IPCA - Novembro (ref. Out/26)', 'ipca', '2026-11-12', 'IPCA referência outubro/2026', 'medium', 'BR', true),
('IPCA - Dezembro (ref. Nov/26)', 'ipca', '2026-12-11', 'IPCA referência novembro/2026', 'medium', 'BR', true),

-- ============================================================
-- B3 Index Options Expiry 2026 (3rd Monday of each month)
-- For BOVA11/IBOV index options
-- ============================================================
('Vencimento Opções - Janeiro', 'options_expiry', '2026-01-19', 'Vencimento de opções sobre índice B3 (3ª segunda-feira)', 'high', 'BR', true),
('Vencimento Opções - Fevereiro', 'options_expiry', '2026-02-16', 'Vencimento de opções sobre índice B3 (3ª segunda-feira)', 'high', 'BR', true),
('Vencimento Opções - Março', 'options_expiry', '2026-03-16', 'Vencimento de opções sobre índice B3 (3ª segunda-feira)', 'high', 'BR', true),
('Vencimento Opções - Abril', 'options_expiry', '2026-04-20', 'Vencimento de opções sobre índice B3 (3ª segunda-feira)', 'high', 'BR', true),
('Vencimento Opções - Maio', 'options_expiry', '2026-05-18', 'Vencimento de opções sobre índice B3 (3ª segunda-feira)', 'high', 'BR', true),
('Vencimento Opções - Junho', 'options_expiry', '2026-06-15', 'Vencimento de opções sobre índice B3 (3ª segunda-feira)', 'high', 'BR', true),
('Vencimento Opções - Julho', 'options_expiry', '2026-07-20', 'Vencimento de opções sobre índice B3 (3ª segunda-feira)', 'high', 'BR', true),
('Vencimento Opções - Agosto', 'options_expiry', '2026-08-17', 'Vencimento de opções sobre índice B3 (3ª segunda-feira)', 'high', 'BR', true),
('Vencimento Opções - Setembro', 'options_expiry', '2026-09-21', 'Vencimento de opções sobre índice B3 (3ª segunda-feira)', 'high', 'BR', true),
('Vencimento Opções - Outubro', 'options_expiry', '2026-10-19', 'Vencimento de opções sobre índice B3 (3ª segunda-feira)', 'high', 'BR', true),
('Vencimento Opções - Novembro', 'options_expiry', '2026-11-16', 'Vencimento de opções sobre índice B3 (3ª segunda-feira)', 'high', 'BR', true),
('Vencimento Opções - Dezembro', 'options_expiry', '2026-12-21', 'Vencimento de opções sobre índice B3 (3ª segunda-feira)', 'high', 'BR', true),

-- ============================================================
-- Futures Contract Rollover 2026 (WIN/WDO - bi-monthly, even months)
-- Rollover typically happens on the Wednesday closest to the 15th
-- of the expiry month (Feb, Apr, Jun, Aug, Oct, Dec)
-- ============================================================
('Rolagem Futuros - Fevereiro', 'contract_rollover', '2026-02-11', 'Rolagem de contratos futuros WIN/WDO (vencimento fevereiro)', 'medium', 'BR', true),
('Rolagem Futuros - Abril', 'contract_rollover', '2026-04-15', 'Rolagem de contratos futuros WIN/WDO (vencimento abril)', 'medium', 'BR', true),
('Rolagem Futuros - Junho', 'contract_rollover', '2026-06-10', 'Rolagem de contratos futuros WIN/WDO (vencimento junho)', 'medium', 'BR', true),
('Rolagem Futuros - Agosto', 'contract_rollover', '2026-08-12', 'Rolagem de contratos futuros WIN/WDO (vencimento agosto)', 'medium', 'BR', true),
('Rolagem Futuros - Outubro', 'contract_rollover', '2026-10-14', 'Rolagem de contratos futuros WIN/WDO (vencimento outubro)', 'medium', 'BR', true),
('Rolagem Futuros - Dezembro', 'contract_rollover', '2026-12-09', 'Rolagem de contratos futuros WIN/WDO (vencimento dezembro)', 'medium', 'BR', true),

-- ============================================================
-- Major BR Earnings 2026 (Estimated based on typical schedules)
-- Q4 2025 results (Feb-Mar), Q1 2026 results (May), 
-- Q2 2026 results (Aug), Q3 2026 results (Nov)
-- ============================================================

-- VALE3 (Vale) - typically reports late Feb/Mar, late Apr/May, late Jul/Aug, late Oct/Nov
('Resultado VALE3 - 4T25', 'earnings', '2026-02-26', 'Divulgação resultado Vale (VALE3) - 4º trimestre 2025', 'medium', 'BR', false),
('Resultado VALE3 - 1T26', 'earnings', '2026-04-23', 'Divulgação resultado Vale (VALE3) - 1º trimestre 2026', 'medium', 'BR', false),
('Resultado VALE3 - 2T26', 'earnings', '2026-07-23', 'Divulgação resultado Vale (VALE3) - 2º trimestre 2026', 'medium', 'BR', false),
('Resultado VALE3 - 3T26', 'earnings', '2026-10-22', 'Divulgação resultado Vale (VALE3) - 3º trimestre 2026', 'medium', 'BR', false),

-- PETR4 (Petrobras) - typically reports mid-late Feb/Mar, mid May, mid Aug, mid Nov
('Resultado PETR4 - 4T25', 'earnings', '2026-02-25', 'Divulgação resultado Petrobras (PETR4) - 4º trimestre 2025', 'medium', 'BR', false),
('Resultado PETR4 - 1T26', 'earnings', '2026-05-14', 'Divulgação resultado Petrobras (PETR4) - 1º trimestre 2026', 'medium', 'BR', false),
('Resultado PETR4 - 2T26', 'earnings', '2026-08-06', 'Divulgação resultado Petrobras (PETR4) - 2º trimestre 2026', 'medium', 'BR', false),
('Resultado PETR4 - 3T26', 'earnings', '2026-11-05', 'Divulgação resultado Petrobras (PETR4) - 3º trimestre 2026', 'medium', 'BR', false),

-- ITUB4 (Itaú Unibanco) - typically reports early Feb, early May, early Aug, early Nov
('Resultado ITUB4 - 4T25', 'earnings', '2026-02-05', 'Divulgação resultado Itaú (ITUB4) - 4º trimestre 2025', 'medium', 'BR', false),
('Resultado ITUB4 - 1T26', 'earnings', '2026-05-04', 'Divulgação resultado Itaú (ITUB4) - 1º trimestre 2026', 'medium', 'BR', false),
('Resultado ITUB4 - 2T26', 'earnings', '2026-07-30', 'Divulgação resultado Itaú (ITUB4) - 2º trimestre 2026', 'medium', 'BR', false),
('Resultado ITUB4 - 3T26', 'earnings', '2026-11-02', 'Divulgação resultado Itaú (ITUB4) - 3º trimestre 2026', 'medium', 'BR', false),

-- BBDC4 (Bradesco) - typically reports early Feb, early May, early Aug, early Nov
('Resultado BBDC4 - 4T25', 'earnings', '2026-02-04', 'Divulgação resultado Bradesco (BBDC4) - 4º trimestre 2025', 'medium', 'BR', false),
('Resultado BBDC4 - 1T26', 'earnings', '2026-04-30', 'Divulgação resultado Bradesco (BBDC4) - 1º trimestre 2026', 'medium', 'BR', false),
('Resultado BBDC4 - 2T26', 'earnings', '2026-08-03', 'Divulgação resultado Bradesco (BBDC4) - 2º trimestre 2026', 'medium', 'BR', false),
('Resultado BBDC4 - 3T26', 'earnings', '2026-10-29', 'Divulgação resultado Bradesco (BBDC4) - 3º trimestre 2026', 'medium', 'BR', false),

-- B3SA3 (B3) - typically reports mid Feb, mid May, mid Aug, mid Nov
('Resultado B3SA3 - 4T25', 'earnings', '2026-02-19', 'Divulgação resultado B3 (B3SA3) - 4º trimestre 2025', 'medium', 'BR', false),
('Resultado B3SA3 - 1T26', 'earnings', '2026-05-14', 'Divulgação resultado B3 (B3SA3) - 1º trimestre 2026', 'medium', 'BR', false),
('Resultado B3SA3 - 2T26', 'earnings', '2026-08-13', 'Divulgação resultado B3 (B3SA3) - 2º trimestre 2026', 'medium', 'BR', false),
('Resultado B3SA3 - 3T26', 'earnings', '2026-11-12', 'Divulgação resultado B3 (B3SA3) - 3º trimestre 2026', 'medium', 'BR', false);
