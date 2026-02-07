-- =====================================================
-- Performance RPCs: Server-side aggregation
-- Replaces ~65 client-side queries with 5 RPCs
-- =====================================================

-- 1) Dashboard Metrics
CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  p_months int DEFAULT 12,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start text;
  v_end text;
  v_result json;
BEGIN
  -- Calculate date range
  IF p_start_date IS NOT NULL THEN
    v_start := to_char(p_start_date, 'YYYY-MM-DD');
  ELSE
    v_start := to_char(date_trunc('month', now()) - ((p_months - 1) || ' months')::interval, 'YYYY-MM-DD');
  END IF;

  IF p_end_date IS NOT NULL THEN
    v_end := to_char(p_end_date, 'YYYY-MM-DD');
  ELSE
    v_end := to_char(now(), 'YYYY-MM-DD');
  END IF;

  SELECT json_build_object(
    'totalClients', (SELECT COALESCE(count(*), 0) FROM clients WHERE active = true),
    'totalClientsPF', (SELECT COALESCE(count(*), 0) FROM clients WHERE active = true AND type = 'pf'),
    'totalClientsPJ', (SELECT COALESCE(count(*), 0) FROM clients WHERE active = true AND type = 'pj'),
    'totalLeads', (SELECT COALESCE(count(*), 0) FROM leads WHERE status NOT IN ('convertido', 'perdido')),
    'leadsByStatus', (
      SELECT COALESCE(json_object_agg(s, c), '{}')
      FROM (
        SELECT status AS s, count(*) AS c
        FROM leads
        GROUP BY status
      ) sub
    ),
    'totalRevenue', (
      SELECT COALESCE(sum(our_share), 0)
      FROM revenues
      WHERE date::text >= v_start AND date::text <= v_end
    ),
    'monthlyRevenue', (
      SELECT COALESCE(sum(our_share), 0)
      FROM revenues
      WHERE date::text LIKE left(v_end, 7) || '%'
    ),
    'totalLotsTraded', (
      SELECT COALESCE(sum(lots_traded), 0)
      FROM contracts
      WHERE date::text >= v_start AND date::text <= v_end
    ),
    'totalLotsZeroed', (
      SELECT COALESCE(sum(lots_zeroed), 0)
      FROM contracts
      WHERE date::text >= v_start AND date::text <= v_end
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 2) Revenue Chart
CREATE OR REPLACE FUNCTION get_revenue_chart(
  p_months int DEFAULT 12,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start text;
  v_end text;
  v_result json;
BEGIN
  IF p_start_date IS NOT NULL THEN
    v_start := to_char(p_start_date, 'YYYY-MM-DD');
  ELSE
    v_start := to_char(date_trunc('month', now()) - ((p_months - 1) || ' months')::interval, 'YYYY-MM-DD');
  END IF;

  IF p_end_date IS NOT NULL THEN
    v_end := to_char(p_end_date, 'YYYY-MM-DD');
  ELSE
    v_end := to_char(now(), 'YYYY-MM-DD');
  END IF;

  SELECT COALESCE(json_agg(row_to_json(sub) ORDER BY sub.month_key), '[]'::json)
  INTO v_result
  FROM (
    SELECT
      to_char(m.d, 'Mon/YY') AS month,
      to_char(m.d, 'YYYY-MM') AS month_key,
      COALESCE(sum(r.our_share), 0) AS value
    FROM generate_series(
      date_trunc('month', v_start::date),
      date_trunc('month', v_end::date),
      '1 month'::interval
    ) AS m(d)
    LEFT JOIN revenues r ON left(r.date::text, 7) = to_char(m.d, 'YYYY-MM')
      AND r.date::text >= v_start AND r.date::text <= v_end
    GROUP BY m.d
  ) sub;

  RETURN v_result;
END;
$$;

-- 3) Contracts Chart
CREATE OR REPLACE FUNCTION get_contracts_chart(
  p_months int DEFAULT 12,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start text;
  v_end text;
  v_result json;
BEGIN
  IF p_start_date IS NOT NULL THEN
    v_start := to_char(p_start_date, 'YYYY-MM-DD');
  ELSE
    v_start := to_char(date_trunc('month', now()) - ((p_months - 1) || ' months')::interval, 'YYYY-MM-DD');
  END IF;

  IF p_end_date IS NOT NULL THEN
    v_end := to_char(p_end_date, 'YYYY-MM-DD');
  ELSE
    v_end := to_char(now(), 'YYYY-MM-DD');
  END IF;

  SELECT COALESCE(json_agg(row_to_json(sub) ORDER BY sub.month_key), '[]'::json)
  INTO v_result
  FROM (
    SELECT
      to_char(m.d, 'Mon/YY') AS month,
      to_char(m.d, 'YYYY-MM') AS month_key,
      COALESCE(sum(c.lots_traded), 0) AS girados,
      COALESCE(sum(c.lots_zeroed), 0) AS zerados
    FROM generate_series(
      date_trunc('month', v_start::date),
      date_trunc('month', v_end::date),
      '1 month'::interval
    ) AS m(d)
    LEFT JOIN contracts c ON left(c.date::text, 7) = to_char(m.d, 'YYYY-MM')
      AND c.date::text >= v_start AND c.date::text <= v_end
    GROUP BY m.d
  ) sub;

  RETURN v_result;
END;
$$;

-- 4) Clients Chart (unique clients with revenue per month)
CREATE OR REPLACE FUNCTION get_clients_chart(
  p_months int DEFAULT 12,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start text;
  v_end text;
  v_result json;
BEGIN
  IF p_start_date IS NOT NULL THEN
    v_start := to_char(p_start_date, 'YYYY-MM-DD');
  ELSE
    v_start := to_char(date_trunc('month', now()) - ((p_months - 1) || ' months')::interval, 'YYYY-MM-DD');
  END IF;

  IF p_end_date IS NOT NULL THEN
    v_end := to_char(p_end_date, 'YYYY-MM-DD');
  ELSE
    v_end := to_char(now(), 'YYYY-MM-DD');
  END IF;

  SELECT COALESCE(json_agg(row_to_json(sub) ORDER BY sub.month_key), '[]'::json)
  INTO v_result
  FROM (
    SELECT
      to_char(m.d, 'Mon/YY') AS month,
      to_char(m.d, 'YYYY-MM') AS month_key,
      COALESCE(rc.cnt, 0) AS clientes
    FROM generate_series(
      date_trunc('month', v_start::date),
      date_trunc('month', v_end::date),
      '1 month'::interval
    ) AS m(d)
    LEFT JOIN (
      SELECT left(date::text, 7) AS ym, count(DISTINCT client_id) AS cnt
      FROM revenues
      WHERE date::text >= v_start AND date::text <= v_end
      GROUP BY left(date, 7)
    ) rc ON rc.ym = to_char(m.d, 'YYYY-MM')
  ) sub;

  RETURN v_result;
END;
$$;

-- 5) Retention Dashboard (replaces ~45 queries)
CREATE OR REPLACE FUNCTION get_retention_dashboard()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  WITH latest_scores AS (
    SELECT DISTINCT ON (client_id)
      client_id, score, classification
    FROM client_health_scores
    ORDER BY client_id, calculated_at DESC
  ),
  health_summary AS (
    SELECT
      COALESCE(count(*) FILTER (WHERE classification = 'healthy'), 0) AS healthy,
      COALESCE(count(*) FILTER (WHERE classification = 'attention'), 0) AS attention,
      COALESCE(count(*) FILTER (WHERE classification = 'critical'), 0) AS critical,
      COALESCE(count(*) FILTER (WHERE classification = 'lost'), 0) AS lost,
      count(*) AS total,
      COALESCE(round(avg(score)), 0) AS "averageScore"
    FROM latest_scores
  ),
  action_stats AS (
    SELECT
      COALESCE(count(*) FILTER (WHERE status = 'pending'), 0) AS pending,
      COALESCE(count(*) FILTER (WHERE status = 'completed'), 0) AS completed,
      COALESCE(count(DISTINCT (client_id || '-' || playbook_id)) FILTER (WHERE status = 'pending'), 0) AS active_playbooks
    FROM retention_actions
  ),
  churn_stats AS (
    SELECT
      CASE
        WHEN count(*) FILTER (WHERE outcome IN ('retained', 'churned')) = 0 THEN 100
        ELSE round(
          count(*) FILTER (WHERE outcome = 'retained') * 100.0 /
          NULLIF(count(*) FILTER (WHERE outcome IN ('retained', 'churned')), 0)
        )
      END AS retention_rate
    FROM churn_events
  ),
  at_risk AS (
    SELECT json_agg(row_to_json(sub) ORDER BY sub."healthScore") AS clients
    FROM (
      SELECT
        ls.client_id AS "clientId",
        CASE WHEN c.type = 'pf' THEN c.name ELSE COALESCE(c.company_name, c.name) END AS "clientName",
        c.type AS "clientType",
        ls.score AS "healthScore",
        ls.classification,
        ce.churn_probability AS "churnProbability",
        c.assessor_id AS "assessorId"
      FROM latest_scores ls
      JOIN clients c ON c.id = ls.client_id AND c.active = true
      LEFT JOIN LATERAL (
        SELECT churn_probability
        FROM churn_events
        WHERE client_id = ls.client_id
        ORDER BY predicted_at DESC
        LIMIT 1
      ) ce ON true
      WHERE ls.classification IN ('attention', 'critical', 'lost')
      ORDER BY ls.score ASC
      LIMIT 200
    ) sub
  )
  SELECT json_build_object(
    'clientsAtRisk', (SELECT COALESCE(json_array_length(clients), 0) FROM at_risk),
    'activePlaybooks', (SELECT active_playbooks FROM action_stats),
    'actionsPending', (SELECT pending FROM action_stats),
    'actionsCompleted', (SELECT completed FROM action_stats),
    'retentionRate', (SELECT retention_rate FROM churn_stats),
    'healthSummary', (SELECT row_to_json(health_summary) FROM health_summary),
    'atRiskClients', (SELECT COALESCE(clients, '[]'::json) FROM at_risk)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
