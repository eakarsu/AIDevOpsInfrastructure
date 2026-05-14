const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { queryOpenRouter } = require('../openrouter');
const { parseAIJson } = require('../parseAIJson');
const router = express.Router();

const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

async function persistInsight({ resource_type, resource_id, prompt_summary, result, user_id }) {
  try {
    const response_text = typeof result.result === 'string' ? result.result : JSON.stringify(result);
    const tokens_estimate = result.usage ? result.usage.total_tokens : null;
    await pool.query(
      `INSERT INTO ai_insights (resource_type, resource_id, prompt_summary, response_text, model_used, tokens_estimate, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [resource_type, resource_id || null, prompt_summary, response_text, MODEL, tokens_estimate, user_id || null]
    );
  } catch (err) {
    console.error('Failed to persist AI insight:', err.message);
  }
}

// POST /api/ai/incident-auto-triage
// Fetches incident, calls AI for root_cause + remediation + priority, creates linked task record
router.post('/incident-auto-triage', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { incident_id } = req.body;
    if (!incident_id) return res.status(400).json({ error: 'incident_id is required' });

    const incidentResult = await pool.query('SELECT * FROM incident_responses WHERE id = $1', [incident_id]);
    if (incidentResult.rows.length === 0) return res.status(404).json({ error: 'Incident not found' });

    const incident = incidentResult.rows[0];

    const prompt = `Triage this incident and respond ONLY in JSON with format: {"root_cause": "string", "remediation": ["string"], "priority": "P1|P2|P3|P4", "estimated_resolution_time": "string", "recommended_team": "string", "escalation_needed": true|false}

Incident:
Title: ${incident.title}
Severity: ${incident.severity}
Type: ${incident.incident_type}
Affected Services: ${incident.affected_services}
Status: ${incident.status}
Description: ${incident.description || 'N/A'}
Known Root Cause: ${incident.root_cause || 'Not yet determined'}`;

    const aiResult = await queryOpenRouter(prompt, 'You are an expert SRE incident commander. Provide structured triage analysis.');

    const parsed = parseAIJson(aiResult.result || '');

    // Create linked task record in incident_responses (update with triage info)
    await pool.query(
      `UPDATE incident_responses SET root_cause = $1, remediation = $2, status = $3, updated_at = NOW() WHERE id = $4`,
      [
        parsed.root_cause || incident.root_cause,
        parsed.remediation ? JSON.stringify(parsed.remediation) : incident.remediation,
        incident.status === 'open' ? 'in_progress' : incident.status,
        incident_id,
      ]
    );

    // Persist to ai_insights
    persistInsight({
      resource_type: 'incident',
      resource_id: incident_id,
      prompt_summary: `Auto-triage for incident: ${incident.title}`,
      result: aiResult,
      user_id: req.user ? req.user.id : null,
    });

    res.json({
      incident_id,
      triage: parsed,
      model_used: MODEL,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/dora-metrics
// Aggregates deployment records, computes DORA metrics, uses AI to generate commentary
router.post('/dora-metrics', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { date_range } = req.body;
    const days = date_range && date_range.days ? parseInt(date_range.days) : 30;

    const [deployments, incidents] = await Promise.all([
      pool.query(
        `SELECT id, status, build_time, created_at, updated_at FROM deployment_pipelines
         WHERE created_at >= NOW() - INTERVAL '${days} days'
         ORDER BY created_at DESC`
      ),
      pool.query(
        `SELECT id, severity, started_at, resolved_at, status FROM incident_responses
         WHERE created_at >= NOW() - INTERVAL '${days} days'
         ORDER BY created_at DESC`
      ),
    ]);

    const totalDeployments = deployments.rows.length;
    const deployFrequency = (totalDeployments / days).toFixed(2);

    const resolved = incidents.rows.filter(i => i.resolved_at && i.started_at);
    const avgMttr = resolved.length > 0
      ? (resolved.reduce((sum, i) => {
          const start = new Date(i.started_at);
          const end = new Date(i.resolved_at);
          return sum + (end - start) / 60000; // minutes
        }, 0) / resolved.length).toFixed(0)
      : 0;

    const failedDeploys = deployments.rows.filter(d => d.status === 'failed').length;
    const changeFailureRate = totalDeployments > 0
      ? ((failedDeploys / totalDeployments) * 100).toFixed(1)
      : 0;

    const metrics = {
      period_days: days,
      total_deployments: totalDeployments,
      deployment_frequency: `${deployFrequency} deployments/day`,
      mttr_minutes: parseInt(avgMttr),
      change_failure_rate: `${changeFailureRate}%`,
      total_incidents: incidents.rows.length,
    };

    const prompt = `Analyze these DORA metrics and provide commentary. Respond ONLY in JSON with format: {"health_score": <0-100>, "assessment": "string", "strengths": ["string"], "improvement_areas": ["string"], "recommendations": ["string"], "benchmark_comparison": "string"}

Metrics for last ${days} days:
${JSON.stringify(metrics, null, 2)}`;

    const aiResult = await queryOpenRouter(prompt, 'You are a DevOps performance analyst specializing in DORA metrics and engineering excellence.');

    const commentary = parseAIJson(aiResult.result || '');

    persistInsight({
      resource_type: 'dora_metrics',
      prompt_summary: `DORA metrics analysis for last ${days} days`,
      result: aiResult,
      user_id: req.user ? req.user.id : null,
    });

    res.json({ metrics, commentary, model_used: MODEL });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/cost-anomaly
// Calls AI for spend spike explanation and remediation recommendations
router.post('/cost-anomaly', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { resource_type, current_spend, baseline_spend } = req.body;

    if (!resource_type) return res.status(400).json({ error: 'resource_type is required' });
    if (current_spend === undefined || current_spend === null) return res.status(400).json({ error: 'current_spend is required' });
    if (baseline_spend === undefined || baseline_spend === null) return res.status(400).json({ error: 'baseline_spend is required' });

    const delta = (current_spend - baseline_spend).toFixed(2);
    const pctChange = baseline_spend > 0
      ? (((current_spend - baseline_spend) / baseline_spend) * 100).toFixed(1)
      : 'N/A';

    const prompt = `Analyze this cloud cost anomaly and respond ONLY in JSON with format: {"anomaly_severity": "low|medium|high|critical", "likely_causes": ["string"], "remediation_steps": ["string"], "estimated_savings": "string", "urgency": "string", "preventive_measures": ["string"]}

Resource Type: ${resource_type}
Current Spend: $${current_spend}
Baseline Spend: $${baseline_spend}
Delta: $${delta} (${pctChange}% change)`;

    const aiResult = await queryOpenRouter(prompt, 'You are a cloud FinOps expert specializing in cost anomaly detection and cloud spend optimization.');

    const analysis = parseAIJson(aiResult.result || '');

    persistInsight({
      resource_type: 'cost_anomaly',
      prompt_summary: `Cost anomaly: ${resource_type}, $${baseline_spend} → $${current_spend} (${pctChange}%)`,
      result: aiResult,
      user_id: req.user ? req.user.id : null,
    });

    res.json({
      resource_type,
      current_spend,
      baseline_spend,
      delta: parseFloat(delta),
      pct_change: pctChange,
      analysis,
      model_used: MODEL,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/recommend-scaling
// Audit recommendation: stateless scaling-recommendation given metrics summary.
router.post('/recommend-scaling', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { service_name, metrics, traffic_pattern } = req.body;
    if (!service_name || !metrics) {
      return res.status(400).json({ error: 'service_name and metrics are required' });
    }

    const prompt = `You are an expert SRE advisor. Recommend scaling actions for a service given recent metrics. Return JSON only:
{
  "recommendation": "scale_up|scale_down|hold|hpa_adjust",
  "target_replica_count_suggestion": number_or_null,
  "horizontal_pod_autoscaler_changes": { "min": null, "max": null, "target_cpu_pct": null },
  "rationale": "string",
  "risk_factors": ["string"],
  "confidence": "low|medium|high"
}

SERVICE: ${service_name}

METRICS:
${typeof metrics === 'string' ? metrics : JSON.stringify(metrics, null, 2)}

TRAFFIC PATTERN (optional):
${traffic_pattern ? (typeof traffic_pattern === 'string' ? traffic_pattern : JSON.stringify(traffic_pattern, null, 2)) : 'Not provided'}`;

    const aiResult = await queryOpenRouter(prompt, 'You are an expert SRE / infrastructure scaling advisor.');
    const parsed = parseAIJson(aiResult.result || '');

    res.json({
      service_name,
      scaling_recommendation: parsed,
      raw: aiResult.result,
      model_used: MODEL,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/security-risk-assessment
// Audit recommendation: stateless security-risk assessment for a posture summary.
router.post('/security-risk-assessment', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { posture_summary, asset_inventory } = req.body;
    if (!posture_summary) {
      return res.status(400).json({ error: 'posture_summary is required' });
    }

    const prompt = `You are a security advisor. Given a posture summary and optional asset inventory, return JSON only:
{
  "overall_risk_level": "low|medium|high|critical",
  "top_findings": [{ "finding": "string", "severity": "low|medium|high|critical", "remediation": "string", "owner_role": "string" }],
  "missing_controls": ["string"],
  "compliance_concerns": ["string"],
  "next_actions": ["string"],
  "confidence": "low|medium|high"
}

POSTURE SUMMARY:
${typeof posture_summary === 'string' ? posture_summary : JSON.stringify(posture_summary, null, 2)}

ASSET INVENTORY (optional):
${asset_inventory ? (typeof asset_inventory === 'string' ? asset_inventory : JSON.stringify(asset_inventory, null, 2)) : 'Not provided'}`;

    const aiResult = await queryOpenRouter(prompt, 'You are a senior security advisor providing concise, actionable risk assessments.');
    const parsed = parseAIJson(aiResult.result || '');

    res.json({
      assessment: parsed,
      raw: aiResult.result,
      model_used: MODEL,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Apply pass 4 (mechanical backlog) ===

function hasOpenRouterKey() {
  const k = process.env.OPENROUTER_API_KEY;
  if (!k) return false;
  if (/^your[_-]?openrouter[_-]?api[_-]?key/i.test(k)) return false;
  return true;
}

// POST /api/ai/predict-failure
router.post('/predict-failure', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!hasOpenRouterKey()) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    const { component, telemetry, history } = req.body;
    if (!component) return res.status(400).json({ error: 'component is required' });

    const prompt = `Predict the likelihood and timing of failure for an infrastructure component. Return JSON only:
{
  "failure_probability_24h": <0-1>,
  "failure_probability_7d": <0-1>,
  "leading_indicators": ["string"],
  "predicted_failure_modes": [ { "mode": "string", "probability": <0-1>, "rationale": "string" } ],
  "recommended_preemptive_actions": ["string"],
  "confidence": "low|medium|high"
}

COMPONENT: ${component}

TELEMETRY:
${telemetry ? (typeof telemetry === 'string' ? telemetry : JSON.stringify(telemetry, null, 2)) : 'Not provided'}

HISTORY:
${history ? (typeof history === 'string' ? history : JSON.stringify(history, null, 2)) : 'Not provided'}`;

    const aiResult = await queryOpenRouter(prompt, 'You are an SRE reliability analyst predicting infrastructure failures.');
    const parsed = parseAIJson(aiResult.result || '');

    persistInsight({
      resource_type: 'failure_prediction',
      prompt_summary: `Failure prediction for ${component}`,
      result: aiResult,
      user_id: req.user ? req.user.id : null,
    });

    res.json({ component, prediction: parsed, raw: aiResult.result, model_used: MODEL });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/incident-prediction
router.post('/incident-prediction', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!hasOpenRouterKey()) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    const { recent_incidents, system_state, time_window_hours } = req.body;
    const window = parseInt(time_window_hours) || 24;

    const prompt = `Predict likely classes of incidents in the next ${window} hours. Return JSON only:
{
  "predicted_incidents": [ { "class": "string", "probability": <0-1>, "expected_severity": "P1|P2|P3|P4", "rationale": "string", "preventive_steps": ["string"] } ],
  "overall_risk": "low|medium|high|critical",
  "monitoring_focus": ["string"],
  "confidence": "low|medium|high"
}

RECENT INCIDENTS:
${recent_incidents ? (typeof recent_incidents === 'string' ? recent_incidents : JSON.stringify(recent_incidents, null, 2)) : 'Not provided'}

SYSTEM STATE:
${system_state ? (typeof system_state === 'string' ? system_state : JSON.stringify(system_state, null, 2)) : 'Not provided'}`;

    const aiResult = await queryOpenRouter(prompt, 'You are an SRE incident-prediction analyst.');
    const parsed = parseAIJson(aiResult.result || '');

    persistInsight({
      resource_type: 'incident_prediction',
      prompt_summary: `Incident prediction window=${window}h`,
      result: aiResult,
      user_id: req.user ? req.user.id : null,
    });

    res.json({ time_window_hours: window, prediction: parsed, raw: aiResult.result, model_used: MODEL });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/cost-forecasting
router.post('/cost-forecasting', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!hasOpenRouterKey()) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    const { historical_spend, growth_factors, forecast_months } = req.body;
    if (!historical_spend) return res.status(400).json({ error: 'historical_spend is required' });
    const months = parseInt(forecast_months) || 6;

    const prompt = `Forecast cloud spend for the next ${months} months. Return JSON only:
{
  "forecast_months": ${months},
  "monthly_forecast": [ { "month_offset": <int>, "expected_spend": <number>, "low": <number>, "high": <number> } ],
  "total_expected": <number>,
  "key_drivers": ["string"],
  "savings_opportunities": ["string"],
  "confidence": "low|medium|high"
}

HISTORICAL SPEND:
${typeof historical_spend === 'string' ? historical_spend : JSON.stringify(historical_spend, null, 2)}

GROWTH FACTORS:
${growth_factors ? (typeof growth_factors === 'string' ? growth_factors : JSON.stringify(growth_factors, null, 2)) : 'Not provided'}`;

    const aiResult = await queryOpenRouter(prompt, 'You are a FinOps analyst forecasting cloud spend.');
    const parsed = parseAIJson(aiResult.result || '');

    persistInsight({
      resource_type: 'cost_forecast',
      prompt_summary: `Cost forecast ${months} months`,
      result: aiResult,
      user_id: req.user ? req.user.id : null,
    });

    res.json({ forecast: parsed, raw: aiResult.result, model_used: MODEL });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/detect-anomalies
router.post('/detect-anomalies', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!hasOpenRouterKey()) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    const { metric_name, series, baseline } = req.body;
    if (!metric_name || !series) return res.status(400).json({ error: 'metric_name and series are required' });

    const prompt = `Detect anomalies in this metric series. Return JSON only:
{
  "anomalies": [ { "index": <int>, "value": <number>, "expected_range": [<number>, <number>], "severity": "low|medium|high", "explanation": "string" } ],
  "overall_assessment": "string",
  "trend": "rising|falling|stable|cyclic",
  "recommended_actions": ["string"],
  "confidence": "low|medium|high"
}

METRIC: ${metric_name}

SERIES:
${typeof series === 'string' ? series : JSON.stringify(series, null, 2)}

BASELINE:
${baseline ? (typeof baseline === 'string' ? baseline : JSON.stringify(baseline, null, 2)) : 'Not provided'}`;

    const aiResult = await queryOpenRouter(prompt, 'You are an SRE anomaly-detection analyst.');
    const parsed = parseAIJson(aiResult.result || '');

    persistInsight({
      resource_type: 'anomaly_detection',
      prompt_summary: `Anomaly detection for ${metric_name}`,
      result: aiResult,
      user_id: req.user ? req.user.id : null,
    });

    res.json({ metric_name, detection: parsed, raw: aiResult.result, model_used: MODEL });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
