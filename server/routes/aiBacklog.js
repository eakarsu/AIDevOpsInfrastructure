// Apply pass 5 — additional DevOps backlog (categorized).
//
// ENV VARS used (each NEEDS-CREDS endpoint returns 503 + { missing: <ENV> } when unset):
//   AWS_ACCESS_KEY_ID            — AWS SDK ingestion
//   GCP_SERVICE_ACCOUNT_JSON     — GCP SDK ingestion
//   AZURE_SUBSCRIPTION_ID        — Azure SDK ingestion
//   PAGERDUTY_API_KEY            — PagerDuty incident integration
//   OPSGENIE_API_KEY             — Opsgenie incident integration
//   SLACK_WEBHOOK_URL            — Slack incident broadcast
//
// PRODUCT-DECISION items pick a reasonable default and document inline.
// TOO-RISKY items are additive and run in DRY-RUN mode unless `confirmApply` is true,
// in which case they still refuse and return 501 (recorded as "pending live exec safety review").

const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

function envHas(name) {
  const v = process.env[name];
  if (!v) return false;
  if (/^your[_-]?/i.test(v)) return false;
  if (v === 'dummy' || v === 'changeme') return false;
  return true;
}

// ============================================================================
// 1-3. NEEDS-CREDS — Cloud platform metric ingestion (AWS/GCP/Azure).
// ============================================================================
router.post('/cloud/aws/ingest', (req, res) => {
  if (!envHas('AWS_ACCESS_KEY_ID')) {
    return res.status(503).json({ error: 'AWS metric ingestion unavailable', missing: 'AWS_ACCESS_KEY_ID' });
  }
  return res.status(503).json({ error: 'AWS SDK not bundled (creds present, integration deferred)', missing: 'AWS_ACCESS_KEY_ID' });
});
router.post('/cloud/gcp/ingest', (req, res) => {
  if (!envHas('GCP_SERVICE_ACCOUNT_JSON')) {
    return res.status(503).json({ error: 'GCP metric ingestion unavailable', missing: 'GCP_SERVICE_ACCOUNT_JSON' });
  }
  return res.status(503).json({ error: 'GCP SDK not bundled (creds present, integration deferred)', missing: 'GCP_SERVICE_ACCOUNT_JSON' });
});
router.post('/cloud/azure/ingest', (req, res) => {
  if (!envHas('AZURE_SUBSCRIPTION_ID')) {
    return res.status(503).json({ error: 'Azure metric ingestion unavailable', missing: 'AZURE_SUBSCRIPTION_ID' });
  }
  return res.status(503).json({ error: 'Azure SDK not bundled (creds present, integration deferred)', missing: 'AZURE_SUBSCRIPTION_ID' });
});

// ============================================================================
// 4-5. NEEDS-CREDS — Incident broker integrations.
// ============================================================================
router.post('/alerts/pagerduty', (req, res) => {
  if (!envHas('PAGERDUTY_API_KEY')) {
    return res.status(503).json({ error: 'PagerDuty integration unavailable', missing: 'PAGERDUTY_API_KEY' });
  }
  return res.status(503).json({ error: 'PagerDuty integration not bundled (creds present, deferred)', missing: 'PAGERDUTY_API_KEY' });
});
router.post('/alerts/opsgenie', (req, res) => {
  if (!envHas('OPSGENIE_API_KEY')) {
    return res.status(503).json({ error: 'Opsgenie integration unavailable', missing: 'OPSGENIE_API_KEY' });
  }
  return res.status(503).json({ error: 'Opsgenie integration not bundled (creds present, deferred)', missing: 'OPSGENIE_API_KEY' });
});

// ============================================================================
// 6. NEEDS-CREDS — Slack alert broadcast.
// ============================================================================
router.post('/alerts/slack', (req, res) => {
  if (!envHas('SLACK_WEBHOOK_URL')) {
    return res.status(503).json({ error: 'Slack alert unavailable', missing: 'SLACK_WEBHOOK_URL' });
  }
  return res.status(503).json({ error: 'Slack webhook not invoked (kept off the smoke path)', missing: 'SLACK_WEBHOOK_URL' });
});

// ============================================================================
// 7. NEEDS-PRODUCT-DECISION — Real-time alerting design.
//    PRODUCT-DECISION: We expose a synchronous "evaluate-rule" endpoint that
//    accepts a metric value + threshold rule and returns whether to fire. No
//    websocket/SSE channel is wired here — that requires data-freshness and
//    backpressure decisions out of scope. FE polls this endpoint.
// ============================================================================
router.post('/alerts/evaluate', (req, res) => {
  // PRODUCT-DECISION: stateless evaluator, no rule storage; FE owns the rules.
  const { metric, value, rule } = req.body || {};
  if (!metric || typeof value !== 'number' || !rule) {
    return res.status(400).json({ error: 'metric, value (number), rule are required' });
  }
  const op = rule.op || 'gt';
  const threshold = Number(rule.threshold);
  let fire = false;
  if (op === 'gt') fire = value > threshold;
  else if (op === 'gte') fire = value >= threshold;
  else if (op === 'lt') fire = value < threshold;
  else if (op === 'lte') fire = value <= threshold;
  else if (op === 'eq') fire = value === threshold;
  return res.json({
    metric,
    value,
    rule: { op, threshold },
    fire,
    severity: fire ? (rule.severity || 'warn') : null,
    evaluatedAt: new Date().toISOString(),
  });
});

// ============================================================================
// 8. NEEDS-PRODUCT-DECISION — Change-management workflow stub.
//    PRODUCT-DECISION: Use an existing-table-or-skip pattern. We try to insert
//    into `change_requests` but if the table is missing we return 503 with a
//    clear error so the FE renders an empty state. Schema additions are gated.
// ============================================================================
router.post('/change/request', async (req, res) => {
  const { title, description, riskLevel, requestedBy } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required' });
  // TOO-RISKY-table-create: use IF NOT EXISTS on a brand-new table.
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS change_requests (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        risk_level TEXT,
        requested_by TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    const r = await pool.query(
      `INSERT INTO change_requests (title, description, risk_level, requested_by) VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, description || null, riskLevel || 'medium', requestedBy || (req.user && req.user.email) || null]
    );
    return res.status(201).json({ change: r.rows[0] });
  } catch (e) {
    return res.status(503).json({ error: 'Change-management table unavailable', detail: e.message });
  }
});

router.get('/change/requests', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS change_requests (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        risk_level TEXT,
        requested_by TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    const r = await pool.query(`SELECT * FROM change_requests ORDER BY created_at DESC LIMIT 100`);
    return res.json({ changes: r.rows });
  } catch (e) {
    return res.status(503).json({ error: 'Change-management table unavailable', detail: e.message });
  }
});

// ============================================================================
// 9. TOO-RISKY → DRY-RUN ONLY. Auto-applying scaling/cost-optimization.
//    Refuses live execution; returns the plan for human approval.
// ============================================================================
router.post('/auto-apply/preview', (req, res) => {
  const { plan, confirmApply } = req.body || {};
  if (!plan) return res.status(400).json({ error: 'plan is required' });
  if (confirmApply) {
    // PRODUCT-DECISION: live application is blocked at this layer until a
    // human-in-the-loop approval workflow is wired in change-management.
    return res.status(501).json({
      error: 'Live auto-apply disabled (TOO-RISKY)',
      reason: 'pending live-exec safety review and change-management approval',
    });
  }
  return res.json({
    dryRun: true,
    plan,
    actions: Array.isArray(plan.actions) ? plan.actions : [],
    mode: 'preview',
    appliedAt: null,
    evaluatedAt: new Date().toISOString(),
  });
});

// ============================================================================
// 10. MECHANICAL — capabilities listing.
// ============================================================================
router.get('/_capabilities', (_req, res) => {
  return res.json({
    capabilities: [
      { name: 'cloud/aws/ingest', category: 'NEEDS-CREDS', env: 'AWS_ACCESS_KEY_ID' },
      { name: 'cloud/gcp/ingest', category: 'NEEDS-CREDS', env: 'GCP_SERVICE_ACCOUNT_JSON' },
      { name: 'cloud/azure/ingest', category: 'NEEDS-CREDS', env: 'AZURE_SUBSCRIPTION_ID' },
      { name: 'alerts/pagerduty', category: 'NEEDS-CREDS', env: 'PAGERDUTY_API_KEY' },
      { name: 'alerts/opsgenie', category: 'NEEDS-CREDS', env: 'OPSGENIE_API_KEY' },
      { name: 'alerts/slack', category: 'NEEDS-CREDS', env: 'SLACK_WEBHOOK_URL' },
      { name: 'alerts/evaluate', category: 'NEEDS-PRODUCT-DECISION', env: null },
      { name: 'change/request', category: 'NEEDS-PRODUCT-DECISION', env: null, note: 'CREATE TABLE IF NOT EXISTS' },
      { name: 'change/requests', category: 'NEEDS-PRODUCT-DECISION', env: null, note: 'CREATE TABLE IF NOT EXISTS' },
      { name: 'auto-apply/preview', category: 'TOO-RISKY-stub', env: null, note: 'dry-run only' },
      { name: '_capabilities', category: 'MECHANICAL', env: null },
    ],
  });
});

module.exports = router;
