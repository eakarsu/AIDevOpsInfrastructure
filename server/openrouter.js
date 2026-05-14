const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function queryOpenRouter(prompt, systemPrompt = 'You are an expert DevOps and infrastructure AI assistant.') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

  if (!apiKey || apiKey === 'your-openrouter-api-key-here') {
    return {
      success: true,
      model,
      mock: true,
      result: generateMockResponse(prompt),
    };
  }

  const data = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    max_tokens: 2048,
    temperature: 0.7,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI DevOps Infrastructure',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) {
            resolve({ success: false, error: parsed.error.message || 'OpenRouter API error', model, raw: parsed });
          } else {
            resolve({
              success: true,
              model,
              result: parsed.choices[0].message.content,
              usage: parsed.usage,
              id: parsed.id,
            });
          }
        } catch (e) {
          resolve({ success: false, error: 'Failed to parse response', raw: body });
        }
      });
    });

    req.on('error', (e) => resolve({ success: false, error: e.message }));
    req.write(data);
    req.end();
  });
}

function generateMockResponse(prompt) {
  const p = prompt.toLowerCase();

  if (p.includes('auto-scal') || p.includes('scaling')) {
    return `## Auto-Scaling Recommendation

**Current Analysis:**
- CPU utilization trending at 78% (above 70% threshold)
- Memory consumption stable at 62%
- Request latency P99: 340ms (target: 200ms)

**Recommended Actions:**
1. **Horizontal Scale-Out**: Add 3 additional instances to the web tier
2. **Adjust Thresholds**: Set scale-up trigger at 65% CPU, scale-down at 40%
3. **Predictive Scaling**: Enable time-based scaling for 09:00-11:00 peak window
4. **Instance Type**: Migrate from t3.medium to c6g.large for CPU-bound workloads

**Scaling Policy:**
\`\`\`
Min Instances: 4
Max Instances: 20
Target CPU: 60%
Scale-Up Cooldown: 120s
Scale-Down Cooldown: 300s
Step Scaling: +2 at 70%, +4 at 85%
\`\`\`

**Estimated Impact:**
- Latency reduction: ~45% (P99 → 190ms)
- Cost increase: ~$240/month (+18%)
- Availability improvement: 99.95% → 99.99%`;
  }

  if (p.includes('incident') || p.includes('alert') || p.includes('outage')) {
    return `## Incident Response Analysis

**Incident Classification:** SEV-2 — Service Degradation
**Affected Services:** API Gateway, Payment Processing
**Duration:** Estimated 23 minutes

**Root Cause Analysis:**
The database connection pool exhaustion caused cascading failures in the API layer. Connection leak identified in the order-processing microservice v2.4.1.

**Timeline:**
- **T+0m**: Monitoring alert — API error rate exceeded 5%
- **T+3m**: Auto-remediation triggered — Restarted unhealthy pods
- **T+5m**: Connection pool drain initiated
- **T+8m**: Identified connection leak in order-service
- **T+15m**: Deployed hotfix (connection timeout: 30s → 10s)
- **T+23m**: All metrics returned to baseline

**Remediation Steps:**
1. Apply connection pool fix to all environments
2. Add connection leak detection monitor
3. Implement circuit breaker pattern for DB connections
4. Update runbook with new troubleshooting steps
5. Schedule post-incident review for team

**Prevention:**
- Enforce connection pool limits in CI/CD pipeline
- Add load testing for connection exhaustion scenarios
- Implement database proxy (PgBouncer) for connection management`;
  }

  if (p.includes('deploy') || p.includes('pipeline') || p.includes('ci/cd')) {
    return `## Deployment Strategy Recommendation

**Current Pipeline Analysis:**
- Build time: 8m 32s (target: < 5m)
- Test coverage: 82% (target: 90%)
- Deployment frequency: 3x/week
- MTTR: 45 minutes

**Recommended Pipeline:**
\`\`\`
Stage 1: Build & Unit Tests (parallel)
  ├── Docker build (multi-stage)
  ├── Unit tests (Jest/pytest)
  └── Lint & security scan

Stage 2: Integration Tests
  ├── API contract tests
  ├── Database migration check
  └── Dependency vulnerability scan

Stage 3: Staging Deploy
  ├── Canary deployment (10% traffic)
  ├── Smoke tests
  └── Performance baseline check

Stage 4: Production Deploy
  ├── Blue-Green deployment
  ├── Progressive rollout (10→25→50→100%)
  ├── Automated rollback triggers
  └── Post-deploy verification
\`\`\`

**Improvements:**
1. Cache Docker layers → save ~3 minutes build time
2. Parallelize test suites → 40% faster execution
3. Add canary analysis with automated rollback
4. Implement feature flags for safer releases
5. Add deployment windows and change freeze automation`;
  }

  if (p.includes('monitor') || p.includes('observ') || p.includes('metric')) {
    return `## Monitoring & Observability Report

**System Health Overview:**
| Metric | Current | Threshold | Status |
|--------|---------|-----------|--------|
| CPU Usage | 45% | 80% | ✅ Healthy |
| Memory | 67% | 85% | ✅ Healthy |
| Disk I/O | 23% | 70% | ✅ Healthy |
| Network | 340 Mbps | 1 Gbps | ✅ Healthy |
| Error Rate | 0.12% | 1% | ✅ Healthy |
| P99 Latency | 180ms | 500ms | ✅ Healthy |

**Recommended Alerts:**
1. **Golden Signals**: Latency, Traffic, Errors, Saturation
2. **SLO-Based**: 99.9% availability (budget: 43.8 min/month)
3. **Anomaly Detection**: ML-based baseline deviation alerts
4. **Predictive**: Disk space exhaustion in < 72 hours

**Dashboard Recommendations:**
- Executive overview with SLI/SLO burn rates
- Service mesh topology with live latency heatmap
- Cost allocation per team/service
- Deployment correlation with performance metrics

**Tool Stack:**
- Metrics: Prometheus + Grafana
- Logs: ELK Stack or Loki
- Traces: Jaeger or Tempo
- Alerting: PagerDuty integration with smart routing`;
  }

  if (p.includes('secur') || p.includes('vulnerab') || p.includes('compliance')) {
    return `## Security & Compliance Assessment

**Security Posture Score: 78/100**

**Critical Findings:**
1. **CVE-2024-3094** — XZ Utils backdoor in base images
   - Severity: CRITICAL
   - Affected: 12 containers
   - Fix: Update base images to latest patched versions

2. **Exposed Secrets** — 3 hardcoded API keys in config maps
   - Severity: HIGH
   - Fix: Migrate to HashiCorp Vault / AWS Secrets Manager

3. **Network Policy Gaps** — 4 namespaces without network policies
   - Severity: MEDIUM
   - Fix: Apply default-deny ingress/egress policies

**Compliance Status:**
| Standard | Status | Coverage |
|----------|--------|----------|
| SOC 2 Type II | In Progress | 85% |
| ISO 27001 | Compliant | 92% |
| PCI DSS | Gap Identified | 78% |
| HIPAA | N/A | — |

**Recommendations:**
1. Implement OPA/Gatekeeper for policy enforcement
2. Enable runtime security scanning (Falco)
3. Rotate all credentials on 90-day cycle
4. Add SBOM generation to CI/CD pipeline
5. Enable audit logging for all API access`;
  }

  if (p.includes('cost') || p.includes('optim') || p.includes('budget') || p.includes('cloud')) {
    return `## Cloud Cost Optimization Report

**Monthly Spend: $47,320 (+12% MoM)**

**Top Cost Drivers:**
| Service | Monthly Cost | % of Total | Trend |
|---------|-------------|------------|-------|
| EC2 Instances | $18,500 | 39% | ↑ 8% |
| RDS Databases | $8,200 | 17% | → 0% |
| S3 Storage | $5,100 | 11% | ↑ 15% |
| Data Transfer | $4,800 | 10% | ↑ 22% |
| EKS/K8s | $3,900 | 8% | → 2% |
| Other | $6,820 | 15% | ↑ 5% |

**Savings Opportunities ($12,400/month):**
1. **Right-sizing** — 14 over-provisioned instances → save $4,200/mo
2. **Reserved Instances** — 1yr RI for stable workloads → save $3,800/mo
3. **S3 Lifecycle** — Move cold data to Glacier → save $2,100/mo
4. **Spot Instances** — Batch jobs on spot fleet → save $1,500/mo
5. **Idle Resources** — 6 unused EBS volumes, 3 unattached EIPs → save $800/mo

**Architecture Recommendations:**
- Implement CloudFront CDN to reduce data transfer costs
- Migrate to Graviton instances for 20% better price/perf
- Enable auto-shutdown for dev/staging environments after hours
- Implement FinOps tagging policy for cost allocation`;
  }

  if (p.includes('container') || p.includes('kubernetes') || p.includes('k8s') || p.includes('docker') || p.includes('orchestr')) {
    return `## Container Orchestration Analysis

**Cluster Health:**
- Nodes: 12 (4 control plane + 8 worker)
- Pods: 186 running / 4 pending / 2 failed
- CPU Allocation: 62% / Memory Allocation: 71%
- Pod Density: 24 pods/node average

**Recommendations:**
1. **Resource Quotas**: Set namespace quotas to prevent noisy neighbors
2. **Pod Disruption Budgets**: Add PDBs for all production services
3. **HPA Tuning**: Adjust scaling metrics from CPU-only to custom metrics
4. **Node Affinity**: Separate batch workloads from latency-sensitive services

**Kubernetes Best Practices:**
\`\`\`yaml
resources:
  requests:
    cpu: "250m"
    memory: "256Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
readinessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
\`\`\`

**Security Hardening:**
- Enable PodSecurityStandards (restricted profile)
- Implement NetworkPolicies for all namespaces
- Use distroless base images
- Enable secrets encryption at rest with KMS`;
  }

  if (p.includes('log') || p.includes('logging') || p.includes('trace') || p.includes('debug')) {
    return `## Log Management & Analysis

**Log Volume:** 2.4 TB/day across 48 services

**Pattern Analysis:**
- ERROR logs increased 34% in last 24 hours
- Top error: "Connection timeout" — 12,847 occurrences
- Correlates with deployment of auth-service v3.2.0

**Structured Logging Standard:**
\`\`\`json
{
  "timestamp": "2024-03-14T10:23:45.123Z",
  "level": "ERROR",
  "service": "auth-service",
  "traceId": "abc-123-def",
  "spanId": "span-456",
  "message": "Connection pool exhausted",
  "metadata": {
    "pool_size": 20,
    "active": 20,
    "waiting": 15
  }
}
\`\`\`

**Recommendations:**
1. Implement log sampling for DEBUG level (10% in prod)
2. Add correlation IDs across all services
3. Set up log-based alerting for error rate spikes
4. Archive logs > 30 days to cold storage
5. Enable distributed tracing with OpenTelemetry`;
  }

  if (p.includes('infra') || p.includes('terraform') || p.includes('provision') || p.includes('iac')) {
    return `## Infrastructure as Code Review

**IaC Coverage: 87%** (target: 95%)

**Uncovered Resources:**
- 8 manually created security groups
- 3 hand-configured load balancers
- 5 IAM roles without Terraform state

**Terraform Module Structure:**
\`\`\`
modules/
├── networking/    (VPC, Subnets, NAT)
├── compute/       (EC2, ASG, Launch Templates)
├── database/      (RDS, ElastiCache, DynamoDB)
├── kubernetes/    (EKS, Node Groups, Add-ons)
├── security/      (IAM, SG, KMS, WAF)
├── monitoring/    (CloudWatch, SNS, Alarms)
└── storage/       (S3, EBS, EFS)
\`\`\`

**Best Practices:**
1. Pin all provider and module versions
2. Use remote state with DynamoDB locking
3. Implement Sentinel/OPA policies for guardrails
4. Run \`terraform plan\` in CI before merge
5. Tag all resources with owner, environment, cost-center

**Drift Detection:**
- 4 resources have drifted from Terraform state
- Schedule weekly drift detection scans
- Alert on critical resource drift immediately`;
  }

  if (p.includes('disaster') || p.includes('backup') || p.includes('recovery') || p.includes('dr')) {
    return `## Disaster Recovery Plan

**RPO: 1 hour | RTO: 4 hours**

**Backup Status:**
| Resource | Frequency | Last Backup | Retention | Status |
|----------|-----------|-------------|-----------|--------|
| Primary DB | Hourly | 10 min ago | 30 days | ✅ |
| Redis Cache | 6-hourly | 2 hrs ago | 7 days | ✅ |
| S3 Data | Cross-region | Real-time | Indefinite | ✅ |
| EBS Volumes | Daily | 14 hrs ago | 14 days | ⚠️ |
| Config/Secrets | On-change | 3 days ago | 90 days | ⚠️ |

**DR Runbook:**
1. Activate Route 53 failover to DR region
2. Promote RDS read replica to primary
3. Scale up DR EKS cluster (min 8 nodes)
4. Verify data consistency checks
5. Update DNS TTL and notify stakeholders

**Recommendations:**
1. Reduce EBS backup frequency to 6-hourly
2. Automate DR failover with Lambda + Step Functions
3. Conduct quarterly DR drill (next: April 15)
4. Add cross-region S3 replication verification
5. Implement chaos engineering tests monthly`;
  }

  // Default DevOps response
  return `## AI DevOps Analysis

**Infrastructure Health Summary:**

**Compute:**
- 24 instances across 3 availability zones
- Average CPU: 45%, Memory: 62%
- 4 instances flagged for right-sizing

**Networking:**
- Ingress: 2.4 Gbps average, 8.1 Gbps peak
- 99.97% uptime (SLA: 99.95%)
- 2 security group rules need review

**Storage:**
- 12 TB used across all services
- Growth rate: 450 GB/month
- 3 stale EBS snapshots (save $120/mo)

**Recommendations:**
1. Implement GitOps workflow with ArgoCD
2. Add service mesh (Istio/Linkerd) for observability
3. Enable AWS Cost Explorer anomaly detection
4. Upgrade Kubernetes to latest stable version
5. Conduct security audit on IAM permissions

**Key Metrics to Track:**
- Deployment frequency: target 10+/week
- Lead time for changes: target < 1 hour
- MTTR: target < 30 minutes
- Change failure rate: target < 5%`;
}

module.exports = { queryOpenRouter };
