-- ============================================================
-- Database Indexes for common query patterns
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_revenues_date ON revenues(date);
CREATE INDEX IF NOT EXISTS idx_revenues_client_date ON revenues(client_id, date);
CREATE INDEX IF NOT EXISTS idx_contracts_date ON contracts(date);
CREATE INDEX IF NOT EXISTS idx_contracts_client_date ON contracts(client_id, date);
CREATE INDEX IF NOT EXISTS idx_platform_costs_date ON platform_costs(date);
CREATE INDEX IF NOT EXISTS idx_platform_costs_client ON platform_costs(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_interactions_client ON interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_client_health_scores_client_calc ON client_health_scores(client_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_retention_actions_status ON retention_actions(status);
CREATE INDEX IF NOT EXISTS idx_retention_actions_client ON retention_actions(client_id);
CREATE INDEX IF NOT EXISTS idx_churn_events_client ON churn_events(client_id);

-- ============================================================
-- Report RPCs
-- ============================================================

-- a) Funnel Report
CREATE OR REPLACE FUNCTION get_funnel_report(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'funnelStages', (
      SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json)
      FROM (
        SELECT status, count(*)::int as count
        FROM leads
        WHERE (p_start_date IS NULL OR created_at >= p_start_date::timestamp)
          AND (p_end_date IS NULL OR created_at <= (p_end_date + interval '1 day')::timestamp)
        GROUP BY status
      ) s
    ),
    'conversionRate', (
      SELECT CASE
        WHEN count(*) FILTER (WHERE status != 'perdido') > 0
        THEN round((count(*) FILTER (WHERE status = 'convertido')::numeric / count(*) FILTER (WHERE status != 'perdido')::numeric) * 100, 2)
        ELSE 0
      END
      FROM leads
      WHERE (p_start_date IS NULL OR created_at >= p_start_date::timestamp)
        AND (p_end_date IS NULL OR created_at <= (p_end_date + interval '1 day')::timestamp)
    ),
    'avgTimeToConvert', (
      SELECT COALESCE(round(avg(EXTRACT(EPOCH FROM (converted_at - created_at)) / 86400)::numeric, 1), 0)
      FROM leads
      WHERE status = 'convertido'
        AND converted_at IS NOT NULL
        AND converted_at >= created_at
        AND EXTRACT(YEAR FROM converted_at) >= 2000
        AND (p_start_date IS NULL OR created_at >= p_start_date::timestamp)
        AND (p_end_date IS NULL OR created_at <= (p_end_date + interval '1 day')::timestamp)
    ),
    'leadsByOrigin', (
      SELECT COALESCE(json_agg(row_to_json(o)), '[]'::json)
      FROM (
        SELECT COALESCE(ori.name, 'Não informado') as origin_name, count(*)::int as count
        FROM leads l
        LEFT JOIN origins ori ON ori.id = l.origin_id
        WHERE (p_start_date IS NULL OR l.created_at >= p_start_date::timestamp)
          AND (p_end_date IS NULL OR l.created_at <= (p_end_date + interval '1 day')::timestamp)
        GROUP BY ori.name
        ORDER BY count DESC
      ) o
    ),
    'leadsByCampaign', (
      SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json)
      FROM (
        SELECT COALESCE(cam.name, 'Sem campanha') as campaign_name, count(*)::int as count
        FROM leads l
        LEFT JOIN campaigns cam ON cam.id = l.campaign_id
        WHERE (p_start_date IS NULL OR l.created_at >= p_start_date::timestamp)
          AND (p_end_date IS NULL OR l.created_at <= (p_end_date + interval '1 day')::timestamp)
        GROUP BY cam.name
        ORDER BY count DESC
      ) c
    ),
    'monthlyLeads', (
      SELECT COALESCE(json_agg(row_to_json(m) ORDER BY m.month), '[]'::json)
      FROM (
        SELECT
          to_char(created_at, 'YYYY-MM') as month,
          count(*)::int as created,
          count(*) FILTER (WHERE status = 'convertido')::int as converted
        FROM leads
        WHERE (p_start_date IS NULL OR created_at >= p_start_date::timestamp)
          AND (p_end_date IS NULL OR created_at <= (p_end_date + interval '1 day')::timestamp)
        GROUP BY to_char(created_at, 'YYYY-MM')
      ) m
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- b) Platforms Report
CREATE OR REPLACE FUNCTION get_platforms_report(
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
  v_start_date date;
  v_end_date date;
  result json;
BEGIN
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    v_start_date := p_start_date;
    v_end_date := p_end_date;
  ELSE
    v_start_date := date_trunc('month', CURRENT_DATE) - ((p_months - 1) || ' months')::interval;
    v_end_date := CURRENT_DATE;
  END IF;

  SELECT json_build_object(
    'platformStats', (
      SELECT COALESCE(json_agg(row_to_json(ps) ORDER BY ps."totalCost" DESC), '[]'::json)
      FROM (
        SELECT
          p.name,
          count(DISTINCT pc.client_id)::int as "clientCount",
          round(abs(sum(pc.value))::numeric, 2) as "totalCost",
          CASE WHEN count(DISTINCT pc.client_id) > 0
            THEN round((abs(sum(pc.value)) / count(DISTINCT pc.client_id))::numeric, 2)
            ELSE 0
          END as "avgCostPerClient"
        FROM platform_costs pc
        JOIN platforms p ON p.id = pc.platform_id
        WHERE pc.date >= v_start_date AND pc.date <= v_end_date
        GROUP BY p.name
      ) ps
    ),
    'monthlyEvolution', (
      SELECT COALESCE(json_agg(row_to_json(me) ORDER BY me.month), '[]'::json)
      FROM (
        SELECT
          to_char(pc.date, 'YYYY-MM') as month,
          round(abs(sum(pc.value))::numeric, 2) as "totalCost",
          count(DISTINCT pc.client_id)::int as "clientCount"
        FROM platform_costs pc
        WHERE pc.date >= v_start_date AND pc.date <= v_end_date
        GROUP BY to_char(pc.date, 'YYYY-MM')
      ) me
    ),
    'topClients', (
      SELECT COALESCE(json_agg(row_to_json(tc)), '[]'::json)
      FROM (
        SELECT
          c.name,
          round(abs(sum(pc.value))::numeric, 2) as "totalCost",
          count(DISTINCT pc.platform_id)::int as "platformCount"
        FROM platform_costs pc
        JOIN clients c ON c.id = pc.client_id
        WHERE pc.date >= v_start_date AND pc.date <= v_end_date
        GROUP BY c.name
        ORDER BY abs(sum(pc.value)) DESC
        LIMIT 20
      ) tc
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- c) Clients Report
CREATE OR REPLACE FUNCTION get_clients_report(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'totalActive', (SELECT count(*)::int FROM clients WHERE active = true),
    'totalInactive', (SELECT count(*)::int FROM clients WHERE active = false),
    'totalPF', (SELECT count(*)::int FROM clients WHERE type = 'pf'),
    'totalPJ', (SELECT count(*)::int FROM clients WHERE type = 'pj'),
    'byState', (
      SELECT COALESCE(json_agg(row_to_json(s) ORDER BY s.count DESC), '[]'::json)
      FROM (
        SELECT state, count(*)::int as count
        FROM clients
        WHERE state IS NOT NULL
        GROUP BY state
      ) s
    ),
    'byProfile', (
      SELECT COALESCE(json_agg(row_to_json(p) ORDER BY p.count DESC), '[]'::json)
      FROM (
        SELECT COALESCE(profile, 'Não definido') as profile, count(*)::int as count
        FROM clients
        GROUP BY profile
      ) p
    ),
    'topByRevenue', (
      SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json)
      FROM (
        SELECT c.name, round(sum(rv.our_share)::numeric, 2) as "totalRevenue"
        FROM revenues rv
        JOIN clients c ON c.id = rv.client_id
        WHERE (p_start_date IS NULL OR rv.date >= p_start_date)
          AND (p_end_date IS NULL OR rv.date <= p_end_date)
        GROUP BY c.name
        ORDER BY sum(rv.our_share) DESC
        LIMIT 20
      ) r
    ),
    'monthlyNew', (
      SELECT COALESCE(json_agg(row_to_json(m) ORDER BY m.month), '[]'::json)
      FROM (
        SELECT to_char(created_at, 'YYYY-MM') as month, count(*)::int as count
        FROM clients
        GROUP BY to_char(created_at, 'YYYY-MM')
      ) m
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- d) Revenues Report
CREATE OR REPLACE FUNCTION get_revenues_report(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  v_month_count int;
BEGIN
  -- Count distinct months for average
  SELECT count(DISTINCT to_char(date, 'YYYY-MM'))
  INTO v_month_count
  FROM revenues
  WHERE (p_start_date IS NULL OR date >= p_start_date)
    AND (p_end_date IS NULL OR date <= p_end_date);

  SELECT json_build_object(
    'totalRevenue', (
      SELECT COALESCE(round(sum(our_share)::numeric, 2), 0)
      FROM revenues
      WHERE (p_start_date IS NULL OR date >= p_start_date)
        AND (p_end_date IS NULL OR date <= p_end_date)
    ),
    'avgMonthly', (
      SELECT CASE WHEN v_month_count > 0
        THEN round((COALESCE(sum(our_share), 0) / v_month_count)::numeric, 2)
        ELSE 0
      END
      FROM revenues
      WHERE (p_start_date IS NULL OR date >= p_start_date)
        AND (p_end_date IS NULL OR date <= p_end_date)
    ),
    'byProduct', (
      SELECT COALESCE(json_agg(row_to_json(bp) ORDER BY bp.total DESC), '[]'::json)
      FROM (
        SELECT p.name, round(sum(r.our_share)::numeric, 2) as total
        FROM revenues r
        JOIN products p ON p.id = r.product_id
        WHERE (p_start_date IS NULL OR r.date >= p_start_date)
          AND (p_end_date IS NULL OR r.date <= p_end_date)
        GROUP BY p.name
      ) bp
    ),
    'byMonth', (
      SELECT COALESCE(json_agg(row_to_json(bm) ORDER BY bm.month), '[]'::json)
      FROM (
        SELECT to_char(date, 'YYYY-MM') as month, round(sum(our_share)::numeric, 2) as total
        FROM revenues
        WHERE (p_start_date IS NULL OR date >= p_start_date)
          AND (p_end_date IS NULL OR date <= p_end_date)
        GROUP BY to_char(date, 'YYYY-MM')
      ) bm
    ),
    'topClients', (
      SELECT COALESCE(json_agg(row_to_json(tc)), '[]'::json)
      FROM (
        SELECT c.name, round(sum(r.our_share)::numeric, 2) as total
        FROM revenues r
        JOIN clients c ON c.id = r.client_id
        WHERE (p_start_date IS NULL OR r.date >= p_start_date)
          AND (p_end_date IS NULL OR r.date <= p_end_date)
        GROUP BY c.name
        ORDER BY sum(r.our_share) DESC
        LIMIT 20
      ) tc
    ),
    'byAssessor', (
      SELECT COALESCE(json_agg(row_to_json(ba) ORDER BY ba.total DESC), '[]'::json)
      FROM (
        SELECT COALESCE(pr.name, 'Não atribuído') as name, round(sum(r.our_share)::numeric, 2) as total
        FROM revenues r
        JOIN clients c ON c.id = r.client_id
        LEFT JOIN profiles pr ON pr.user_id = c.assessor_id
        WHERE (p_start_date IS NULL OR r.date >= p_start_date)
          AND (p_end_date IS NULL OR r.date <= p_end_date)
        GROUP BY pr.name
      ) ba
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- e) Contracts Report
CREATE OR REPLACE FUNCTION get_contracts_report(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  v_total_traded numeric;
  v_total_zeroed numeric;
BEGIN
  SELECT COALESCE(sum(lots_traded), 0), COALESCE(sum(lots_zeroed), 0)
  INTO v_total_traded, v_total_zeroed
  FROM contracts
  WHERE (p_start_date IS NULL OR date >= p_start_date)
    AND (p_end_date IS NULL OR date <= p_end_date);

  SELECT json_build_object(
    'totalLotsTraded', v_total_traded::numeric,
    'totalLotsZeroed', v_total_zeroed::numeric,
    'zeroRate', CASE WHEN v_total_traded > 0 THEN round((v_total_zeroed / v_total_traded * 100)::numeric, 2) ELSE 0 END,
    'byMonth', (
      SELECT COALESCE(json_agg(row_to_json(bm) ORDER BY bm.month), '[]'::json)
      FROM (
        SELECT
          to_char(date, 'YYYY-MM') as month,
          sum(lots_traded)::numeric as traded,
          sum(lots_zeroed)::numeric as zeroed
        FROM contracts
        WHERE (p_start_date IS NULL OR date >= p_start_date)
          AND (p_end_date IS NULL OR date <= p_end_date)
        GROUP BY to_char(date, 'YYYY-MM')
      ) bm
    ),
    'byAsset', (
      SELECT COALESCE(json_agg(row_to_json(ba) ORDER BY ba.traded DESC), '[]'::json)
      FROM (
        SELECT
          COALESCE(a.code, a.name) as name,
          sum(co.lots_traded)::numeric as traded,
          sum(co.lots_zeroed)::numeric as zeroed
        FROM contracts co
        JOIN assets a ON a.id = co.asset_id
        WHERE (p_start_date IS NULL OR co.date >= p_start_date)
          AND (p_end_date IS NULL OR co.date <= p_end_date)
        GROUP BY COALESCE(a.code, a.name)
      ) ba
    ),
    'topClients', (
      SELECT COALESCE(json_agg(row_to_json(tc)), '[]'::json)
      FROM (
        SELECT c.name, sum(co.lots_traded)::numeric as "lotsTraded"
        FROM contracts co
        JOIN clients c ON c.id = co.client_id
        WHERE (p_start_date IS NULL OR co.date >= p_start_date)
          AND (p_end_date IS NULL OR co.date <= p_end_date)
        GROUP BY c.name
        ORDER BY sum(co.lots_traded) DESC
        LIMIT 20
      ) tc
    )
  ) INTO result;

  RETURN result;
END;
$$;
