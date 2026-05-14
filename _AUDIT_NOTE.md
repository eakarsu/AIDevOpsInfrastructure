# Audit Apply Notes — AIDevOpsInfrastructure

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_02.md` (lines 1272-1310).

The audit reports 0 AI endpoints. Inspection shows AI endpoints in
`routes/aiNew.js` (incident-auto-triage, dora-metrics, cost-anomaly) and
generic insight CRUD in `routes/aiInsights.js`. Audit metadata is stale.

## Original audit recommendations

### Missing AI counterparts
- `/optimize-infrastructure`, `/predict-performance`, `/detect-anomalies`,
  `/recommend-scaling`, `/cost-forecasting`, `/security-risk-assessment`,
  `/predict-failure`, `/incident-prediction`.

### Missing non-AI features
- Cloud platform integrations (AWS, GCP, Azure).
- Real-time alerting and incident response automation.
- SLA tracking and reporting.
- Change management workflow.

### Custom feature suggestions
- Predictive infrastructure scaling.
- Anomaly detection.
- Cost optimization automation.
- Failure prediction.
- Security posture automation.

## Implemented in this pass (mechanical)

1. `POST /api/ai/recommend-scaling` — closes audit gap `/recommend-scaling`.
2. `POST /api/ai/security-risk-assessment` — closes audit gap
   `/security-risk-assessment`.

Both stateless, follow the existing `queryOpenRouter` + `parseAIJson` +
`authenticateToken` + `aiRateLimiter` pattern. Verified with `node --check`.

## Backlog (not implemented this pass)

### Mechanical, low-risk
- `/api/ai/predict-failure` — stateless failure-prediction endpoint.
- `/api/ai/incident-prediction` — predict next likely incident class.
- `/api/ai/cost-forecasting` — forecast cloud spend trajectory.
- `/api/ai/detect-anomalies` — generic anomaly detector for metrics.

### Needs product decision
- Real-time alerting design (data freshness, channels).
- Change-management workflow data model.

### Needs credentials / external SDK
- AWS / GCP / Azure SDKs for live metric ingestion.
- PagerDuty / Opsgenie integration.

### Too risky / large refactor
- Auto-applying scaling/cost-optimization changes on live infrastructure
  (correctness, blast-radius, safety review).

## Apply pass 5 (all backlog)

Closed the remaining backlog by adding `server/routes/aiBacklog.js` (mounted at `/api/ai-backlog`). Additive new file. Cap: 10 features.

| Item | Category | Endpoint(s) |
|---|---|---|
| AWS metric ingestion | NEEDS-CREDS `AWS_ACCESS_KEY_ID` | `POST /cloud/aws/ingest` |
| GCP metric ingestion | NEEDS-CREDS `GCP_SERVICE_ACCOUNT_JSON` | `POST /cloud/gcp/ingest` |
| Azure metric ingestion | NEEDS-CREDS `AZURE_SUBSCRIPTION_ID` | `POST /cloud/azure/ingest` |
| PagerDuty integration | NEEDS-CREDS `PAGERDUTY_API_KEY` | `POST /alerts/pagerduty` |
| Opsgenie integration | NEEDS-CREDS `OPSGENIE_API_KEY` | `POST /alerts/opsgenie` |
| Slack alert broadcast | NEEDS-CREDS `SLACK_WEBHOOK_URL` | `POST /alerts/slack` |
| Real-time alerting design | NEEDS-PRODUCT-DECISION (stateless threshold evaluator; FE owns rules) | `POST /alerts/evaluate` |
| Change-management workflow | NEEDS-PRODUCT-DECISION (`CREATE TABLE IF NOT EXISTS change_requests`) | `POST /change/request`, `GET /change/requests` |
| Auto-applying scaling/cost-optimization | TOO-RISKY-stub (dry-run; `confirmApply` returns 501) | `POST /auto-apply/preview` |
| Capabilities listing | MECHANICAL | `GET /_capabilities` |

Smoke test: PASS — `node server/index.js`; logged in `admin@devops.io/password123`; `/cloud/aws/ingest` → 503 `missing:"AWS_ACCESS_KEY_ID"`; `/alerts/evaluate` → `fire:true severity:"crit"`; `/change/request` inserted row id=1 (CREATE TABLE IF NOT EXISTS executed cleanly); `/auto-apply/preview` returned `dryRun:true`.

## Apply pass 4 (mechanical backlog)

Closed all 4 explicitly-MECHANICAL backlog items by extending `server/routes/aiNew.js`:

1. `POST /api/ai/predict-failure`
2. `POST /api/ai/incident-prediction`
3. `POST /api/ai/cost-forecasting`
4. `POST /api/ai/detect-anomalies`

Each reuses existing `queryOpenRouter` + `parseAIJson` + `persistInsight` + `authenticateToken` + `aiRateLimiter` pattern, gated by a new `hasOpenRouterKey()` helper that returns 503 (with `error: "AI service unavailable: OPENROUTER_API_KEY not configured"`) when the key is absent or a known placeholder.

FE: extended `client/src/pages/AINewToolsPage.js` with 4 new tool cards and tabbed forms; added explicit 503 handling in the shared `run()` helper.

Smoke test: PASS — DB created and seeded; logged in `admin@devops.io/password123`; `POST /api/ai/predict-failure` returned HTTP 200 with full LLM JSON output.

## Apply pass 3 (frontend)

**Action:** LEFT-AS-IS — FE already wired.

Client (CRA React Router under `client/src/`) has a dedicated `AINewToolsPage` page that exposes the two pass-2 endpoints (`/api/ai/recommend-scaling`, `/api/ai/security-risk-assessment`) via tabbed forms. It reads JWT from `localStorage`, sends `Authorization: Bearer <token>`, surfaces error/result, and is registered in `App.js` at route `/ai-new-tools`. The CICD agents page also exists for `/api/cicd-agents`. No modifications needed.
