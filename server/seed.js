const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ai_devops_infrastructure',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query(`
      DROP TABLE IF EXISTS disaster_recovery CASCADE;
      DROP TABLE IF EXISTS iac_configs CASCADE;
      DROP TABLE IF EXISTS log_analysis CASCADE;
      DROP TABLE IF EXISTS container_orchestration CASCADE;
      DROP TABLE IF EXISTS cost_optimization CASCADE;
      DROP TABLE IF EXISTS security_compliance CASCADE;
      DROP TABLE IF EXISTS monitoring_alerts CASCADE;
      DROP TABLE IF EXISTS deployment_pipelines CASCADE;
      DROP TABLE IF EXISTS incident_responses CASCADE;
      DROP TABLE IF EXISTS auto_scaling_policies CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Users
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 1. Auto-Scaling Policies
    await client.query(`
      CREATE TABLE auto_scaling_policies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        service_name VARCHAR(255),
        provider VARCHAR(100),
        min_instances INTEGER DEFAULT 1,
        max_instances INTEGER DEFAULT 10,
        target_cpu INTEGER DEFAULT 70,
        target_memory INTEGER DEFAULT 80,
        scaling_type VARCHAR(100),
        cooldown_seconds INTEGER DEFAULT 300,
        current_instances INTEGER DEFAULT 1,
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Incident Responses
    await client.query(`
      CREATE TABLE incident_responses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        severity VARCHAR(20),
        affected_services TEXT,
        incident_type VARCHAR(100),
        started_at TIMESTAMP,
        resolved_at TIMESTAMP,
        root_cause TEXT,
        timeline TEXT,
        remediation TEXT,
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'investigating',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. Deployment Pipelines
    await client.query(`
      CREATE TABLE deployment_pipelines (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        service_name VARCHAR(255),
        pipeline_type VARCHAR(100),
        stages TEXT,
        deploy_strategy VARCHAR(100),
        build_time VARCHAR(50),
        test_coverage VARCHAR(20),
        target_env VARCHAR(100),
        rollback_policy TEXT,
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. Monitoring & Alerts
    await client.query(`
      CREATE TABLE monitoring_alerts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        service_name VARCHAR(255),
        alert_type VARCHAR(100),
        metric_name VARCHAR(255),
        threshold_value VARCHAR(100),
        current_value VARCHAR(100),
        severity VARCHAR(20),
        notification_channel VARCHAR(100),
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 5. Security & Compliance
    await client.query(`
      CREATE TABLE security_compliance (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        scan_type VARCHAR(100),
        target_resource VARCHAR(255),
        vulnerability_count INTEGER DEFAULT 0,
        critical_count INTEGER DEFAULT 0,
        compliance_standard VARCHAR(100),
        compliance_score INTEGER DEFAULT 0,
        findings TEXT,
        recommendations TEXT,
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 6. Cost Optimization
    await client.query(`
      CREATE TABLE cost_optimization (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        cloud_provider VARCHAR(100),
        service_category VARCHAR(100),
        monthly_cost DECIMAL(12,2),
        potential_savings DECIMAL(12,2),
        optimization_type VARCHAR(100),
        affected_resources TEXT,
        recommendation TEXT,
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'identified',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 7. Container Orchestration
    await client.query(`
      CREATE TABLE container_orchestration (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        cluster_name VARCHAR(255),
        orchestrator VARCHAR(100),
        node_count INTEGER DEFAULT 0,
        pod_count INTEGER DEFAULT 0,
        cpu_allocation VARCHAR(50),
        memory_allocation VARCHAR(50),
        namespace VARCHAR(100),
        health_status VARCHAR(50),
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'running',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 8. Log Analysis
    await client.query(`
      CREATE TABLE log_analysis (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        source_service VARCHAR(255),
        log_level VARCHAR(50),
        time_range VARCHAR(100),
        log_volume VARCHAR(100),
        error_count INTEGER DEFAULT 0,
        pattern_detected TEXT,
        anomalies TEXT,
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'analyzed',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 9. Infrastructure as Code
    await client.query(`
      CREATE TABLE iac_configs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        iac_tool VARCHAR(100),
        provider VARCHAR(100),
        resource_type VARCHAR(100),
        resource_count INTEGER DEFAULT 0,
        drift_detected BOOLEAN DEFAULT false,
        last_applied TIMESTAMP,
        module_path VARCHAR(255),
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'synced',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 10. Disaster Recovery
    await client.query(`
      CREATE TABLE disaster_recovery (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        dr_type VARCHAR(100),
        rpo_hours DECIMAL(6,2),
        rto_hours DECIMAL(6,2),
        backup_frequency VARCHAR(100),
        last_backup TIMESTAMP,
        last_drill TIMESTAMP,
        primary_region VARCHAR(100),
        dr_region VARCHAR(100),
        resources_covered TEXT,
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Insert default user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(`INSERT INTO users (email, password, name) VALUES ('admin@devops.io', $1, 'DevOps Engineer')`, [hashedPassword]);

    // ===================== SEED DATA =====================

    // 1. Auto-Scaling Policies (15)
    await client.query(`
      INSERT INTO auto_scaling_policies (title, service_name, provider, min_instances, max_instances, target_cpu, target_memory, scaling_type, cooldown_seconds, current_instances, description, status) VALUES
      ('Web API Auto-Scaler', 'api-gateway', 'AWS', 3, 20, 65, 75, 'Target Tracking', 180, 5, 'Main API gateway auto-scaling policy with CPU and memory targets', 'active'),
      ('Worker Queue Scaler', 'job-processor', 'AWS', 2, 15, 70, 80, 'Step Scaling', 300, 4, 'Queue-based scaling for background job processing workers', 'active'),
      ('Frontend CDN Scaler', 'web-frontend', 'AWS CloudFront', 2, 10, 60, 70, 'Predictive', 120, 3, 'Predictive scaling for frontend origin servers', 'active'),
      ('Database Read Replicas', 'postgres-read', 'AWS RDS', 1, 5, 75, 85, 'Target Tracking', 600, 2, 'Read replica scaling based on connection count and CPU', 'active'),
      ('ML Inference Scaler', 'ml-serving', 'GCP', 1, 8, 80, 90, 'Custom Metric', 240, 2, 'GPU-aware scaling for ML model inference endpoints', 'active'),
      ('Auth Service Scaler', 'auth-service', 'AWS', 2, 12, 60, 70, 'Target Tracking', 180, 3, 'Authentication service with aggressive scale-out policy', 'active'),
      ('Notification Scaler', 'notification-svc', 'AWS', 1, 10, 70, 75, 'Step Scaling', 300, 2, 'Event-driven scaling for push notification service', 'paused'),
      ('Search Engine Scaler', 'elasticsearch', 'AWS', 3, 12, 65, 80, 'Target Tracking', 600, 5, 'Elasticsearch cluster node auto-scaling', 'active'),
      ('Video Transcoder', 'transcoder-svc', 'GCP', 0, 20, 85, 90, 'Queue Length', 120, 0, 'Scale-to-zero video transcoding workers', 'active'),
      ('Payment Gateway', 'payment-svc', 'AWS', 3, 15, 50, 60, 'Target Tracking', 120, 4, 'Critical payment service with conservative scaling', 'active'),
      ('Cache Layer Scaler', 'redis-cluster', 'AWS ElastiCache', 3, 9, 70, 80, 'Step Scaling', 600, 3, 'Redis cluster shard scaling based on memory and connections', 'active'),
      ('Batch Processor', 'batch-etl', 'AWS', 0, 25, 90, 95, 'Schedule Based', 60, 0, 'Scheduled batch ETL jobs with aggressive scaling', 'active'),
      ('GraphQL Gateway', 'graphql-api', 'Azure', 2, 10, 65, 75, 'Target Tracking', 240, 3, 'GraphQL API gateway with federation support', 'active'),
      ('Staging Environment', 'staging-all', 'AWS', 1, 5, 70, 80, 'Schedule Based', 300, 1, 'Dev/staging auto-scaler with time-based shutdown', 'paused'),
      ('Event Stream Processor', 'kafka-consumers', 'AWS MSK', 3, 18, 75, 85, 'Consumer Lag', 180, 6, 'Kafka consumer group scaling based on partition lag', 'active');
    `);

    // 2. Incident Responses (15)
    await client.query(`
      INSERT INTO incident_responses (title, severity, affected_services, incident_type, started_at, resolved_at, root_cause, timeline, remediation, description, status) VALUES
      ('API Gateway 503 Errors', 'SEV-1', 'api-gateway, web-frontend', 'Service Outage', '2024-03-10 02:15:00', '2024-03-10 03:45:00', 'Connection pool exhaustion due to DB connection leak', 'T+0: Alert fired, T+5: Team paged, T+15: Root cause identified, T+90: Resolved', 'Deployed connection pool fix, added monitoring', 'Complete API outage affecting all customers for 90 minutes', 'resolved'),
      ('Database Failover Event', 'SEV-1', 'postgres-primary, all-services', 'Database Failover', '2024-03-08 14:30:00', '2024-03-08 14:42:00', 'Primary DB hardware failure triggered automatic failover', 'T+0: Primary unreachable, T+2: Auto-failover started, T+12: Complete', 'Review failover procedures, add pre-warming for standby', 'Automatic RDS failover with 12 minutes of degraded service', 'resolved'),
      ('Memory Leak in Auth Service', 'SEV-2', 'auth-service', 'Performance Degradation', '2024-03-12 09:00:00', '2024-03-12 11:30:00', 'Memory leak in JWT token cache not evicting expired tokens', 'T+0: Memory alerts, T+30: Investigation, T+150: Hotfix deployed', 'Fixed cache eviction policy, added memory limits', 'Auth service pods OOMKilled repeatedly during peak hours', 'resolved'),
      ('SSL Certificate Expiry', 'SEV-2', 'api-gateway, web-frontend', 'Configuration Error', '2024-03-05 00:00:00', '2024-03-05 01:15:00', 'Automated cert renewal failed due to DNS validation timeout', 'T+0: HTTPS errors, T+15: Manual renewal started, T+75: Restored', 'Fixed DNS provider integration, added 30-day expiry alerts', 'SSL cert expired for main domain causing HTTPS failures', 'resolved'),
      ('Kafka Broker Disk Full', 'SEV-2', 'kafka-cluster, event-processor', 'Resource Exhaustion', '2024-03-11 16:00:00', '2024-03-11 18:00:00', 'Log retention too high on high-volume topic, filled disk', 'T+0: Producer errors, T+10: Disk alert, T+120: Cleaned and fixed', 'Reduced retention, added disk usage alerts at 70%', 'Event processing halted due to Kafka broker disk exhaustion', 'resolved'),
      ('DDoS Attack Mitigation', 'SEV-1', 'cloudfront, api-gateway, waf', 'Security Incident', '2024-03-09 11:00:00', '2024-03-09 13:00:00', 'Layer 7 DDoS attack targeting login endpoint', 'T+0: Traffic spike, T+5: WAF rules activated, T+120: Attack subsided', 'Enhanced rate limiting, added geo-blocking rules', 'Volumetric DDoS attack at 50K rps targeting authentication', 'resolved'),
      ('Deployment Rollback P2', 'SEV-3', 'payment-svc', 'Failed Deployment', '2024-03-13 10:00:00', '2024-03-13 10:30:00', 'New payment service version had incompatible API changes', 'T+0: Deploy, T+5: Error rate spike, T+10: Rollback initiated, T+30: Stable', 'Add API contract tests to pipeline, improve canary analysis', 'Payment service v2.5.0 rolled back due to API incompatibility', 'resolved'),
      ('Redis Cluster Split-Brain', 'SEV-1', 'redis-cluster, cache-layer', 'Infrastructure Failure', '2024-03-07 22:00:00', '2024-03-08 01:00:00', 'Network partition caused Redis Sentinel to elect new master', 'T+0: Inconsistent reads, T+30: Split-brain detected, T+180: Resolved', 'Implemented Redis cluster mode, improved Sentinel config', 'Redis cluster had split-brain scenario with data inconsistency', 'resolved'),
      ('Elevated Error Rates', 'SEV-3', 'search-service', 'Performance Degradation', '2024-03-14 08:00:00', NULL, 'Elasticsearch index corruption after node restart', 'T+0: 5xx errors on search, T+15: Investigating ES health', 'Index rebuild in progress, investigating node restart cause', 'Search service returning errors for 15% of queries', 'investigating'),
      ('S3 Bucket Policy Change', 'SEV-2', 's3-data-lake, etl-pipeline', 'Configuration Error', '2024-03-06 14:00:00', '2024-03-06 15:00:00', 'IAM policy change blocked ETL service access to S3', 'T+0: ETL failures, T+20: IAM issue identified, T+60: Policy restored', 'Add IAM policy change alerts, implement OPA guardrails', 'ETL pipeline broken after unplanned IAM policy modification', 'resolved'),
      ('Pod CrashLoopBackoff Storm', 'SEV-2', 'recommendation-svc, ml-serving', 'Container Failure', '2024-03-11 07:00:00', '2024-03-11 09:00:00', 'ConfigMap update broke environment variable parsing', 'T+0: Pods crashing, T+10: CrashLoop detected, T+120: Config reverted', 'Add config validation in CI, implement config rollback', 'Multiple pods in CrashLoopBackoff after config change', 'resolved'),
      ('Network Latency Spike', 'SEV-3', 'inter-service-mesh', 'Network Issue', '2024-03-13 15:00:00', '2024-03-13 16:30:00', 'ISP peering issue causing cross-AZ latency increase', 'T+0: Latency alerts, T+30: ISP issue confirmed, T+90: Resolved by ISP', 'Add multi-path routing, implement latency-based failover', 'Cross-AZ network latency increased from 2ms to 45ms', 'resolved'),
      ('Terraform State Lock', 'SEV-3', 'infrastructure-pipeline', 'CI/CD Issue', '2024-03-12 16:00:00', '2024-03-12 16:45:00', 'Stale Terraform state lock from crashed pipeline run', 'T+0: Deploy blocked, T+15: Stale lock identified, T+45: Force unlocked', 'Add lock TTL, improve pipeline crash handling', 'Infrastructure deployments blocked by stale state lock', 'resolved'),
      ('CPU Throttling in Production', 'SEV-2', 'api-gateway, graphql-api', 'Resource Constraint', '2024-03-14 12:00:00', NULL, 'Container CPU limits too low for current traffic patterns', 'T+0: Throttling detected, T+10: Scaling up, ongoing investigation', 'Reviewing CPU limits across all production services', 'API services experiencing CPU throttling during peak load', 'mitigating'),
      ('Data Pipeline Backlog', 'SEV-3', 'etl-pipeline, data-warehouse', 'Processing Delay', '2024-03-10 06:00:00', '2024-03-10 12:00:00', 'Upstream data source schema change broke ETL transforms', 'T+0: Pipeline stalled, T+60: Schema change found, T+360: Fixed', 'Add schema registry, implement schema evolution handling', 'ETL pipeline accumulated 6-hour backlog from schema mismatch', 'resolved');
    `);

    // 3. Deployment Pipelines (15)
    await client.query(`
      INSERT INTO deployment_pipelines (title, service_name, pipeline_type, stages, deploy_strategy, build_time, test_coverage, target_env, rollback_policy, description, status) VALUES
      ('API Gateway Pipeline', 'api-gateway', 'CI/CD', 'Build → Unit Test → Integration Test → Staging → Canary → Production', 'Canary', '4m 22s', '91%', 'Production', 'Auto-rollback on 5xx rate > 1%', 'Production deployment pipeline with canary analysis', 'active'),
      ('Frontend Deploy Pipeline', 'web-frontend', 'CI/CD', 'Build → Lint → Unit Test → E2E Test → CDN Deploy', 'Blue-Green', '6m 15s', '84%', 'Production', 'Instant DNS switch to previous version', 'React SPA deployment with CDN invalidation', 'active'),
      ('Auth Service Pipeline', 'auth-service', 'CI/CD', 'Build → SAST → Unit Test → Contract Test → Staging → Production', 'Rolling Update', '5m 30s', '93%', 'Production', 'Rolling rollback with health checks', 'Authentication service with extra security scanning', 'active'),
      ('ML Model Pipeline', 'ml-serving', 'ML Ops', 'Train → Validate → Package → Shadow Test → Production', 'Shadow Deploy', '45m 00s', '88%', 'Production', 'Revert to previous model version', 'ML model training and deployment with shadow testing', 'active'),
      ('Database Migration', 'postgres-primary', 'Migration', 'Validate → Backup → Migrate → Verify → Cutover', 'Expand-Contract', '12m 00s', 'N/A', 'Production', 'Reverse migration script execution', 'Database schema migration with zero-downtime', 'active'),
      ('Microservices Mono-Pipeline', 'all-services', 'CI/CD', 'Detect Changes → Build Affected → Test → Deploy Affected', 'Progressive Rollout', '8m 45s', '87%', 'All', 'Per-service rollback capability', 'Monorepo pipeline deploying only changed services', 'active'),
      ('Infrastructure Pipeline', 'terraform', 'IaC', 'Plan → Policy Check → Apply → Verify → Document', 'Apply with Lock', '3m 20s', 'N/A', 'All', 'Terraform state rollback', 'Terraform infrastructure pipeline with policy gates', 'active'),
      ('Staging Auto-Deploy', 'staging-all', 'CI/CD', 'Build → Test → Auto-Deploy to Staging', 'Replace', '5m 00s', '82%', 'Staging', 'N/A - Staging environment', 'Auto-deploy all merges to main branch to staging', 'active'),
      ('Hotfix Express Pipeline', 'any-service', 'CI/CD', 'Build → Critical Tests → Production', 'Rolling Update', '2m 30s', '60%', 'Production', 'Immediate rollback', 'Expedited pipeline for critical production hotfixes', 'active'),
      ('Security Patch Pipeline', 'all-services', 'Security', 'Scan → Patch → Build → Smoke Test → Deploy', 'Rolling Update', '15m 00s', 'N/A', 'All', 'Revert to pre-patch images', 'Automated security patching pipeline for CVE fixes', 'active'),
      ('Batch Job Deployer', 'batch-etl', 'CI/CD', 'Build → Unit Test → Dry Run → Schedule Deploy', 'Replace', '3m 45s', '76%', 'Production', 'Restore previous job definition', 'ETL and batch job deployment with dry-run validation', 'active'),
      ('Mobile BFF Pipeline', 'mobile-bff', 'CI/CD', 'Build → API Test → Backward Compat → Canary → Production', 'Canary', '7m 10s', '89%', 'Production', 'Auto-rollback on error rate', 'Mobile backend-for-frontend with backward compatibility checks', 'active'),
      ('Chaos Testing Pipeline', 'chaos-mesh', 'Testing', 'Define Experiment → Inject → Monitor → Analyze → Report', 'N/A', '30m 00s', 'N/A', 'Staging', 'Abort and restore steady state', 'Automated chaos engineering experiments in staging', 'paused'),
      ('Multi-Region Deploy', 'global-services', 'CI/CD', 'Build → Test → Deploy US-East → Verify → Deploy EU → Deploy APAC', 'Progressive Regional', '25m 00s', '90%', 'Production', 'Region-by-region rollback', 'Multi-region deployment with progressive rollout', 'active'),
      ('Canary Analysis Pipeline', 'api-gateway', 'Analysis', 'Deploy Canary → Collect Metrics → Statistical Analysis → Promote/Rollback', 'Canary with Analysis', '15m 00s', 'N/A', 'Production', 'Automatic canary rejection', 'Automated canary analysis with statistical significance testing', 'active');
    `);

    // 4. Monitoring & Alerts (15)
    await client.query(`
      INSERT INTO monitoring_alerts (title, service_name, alert_type, metric_name, threshold_value, current_value, severity, notification_channel, description, status) VALUES
      ('API Error Rate Alert', 'api-gateway', 'Threshold', 'http_5xx_rate', '> 1%', '0.3%', 'critical', 'PagerDuty + Slack #incidents', 'Fires when API 5xx error rate exceeds 1% over 5 minutes', 'active'),
      ('CPU Utilization Warning', 'all-services', 'Threshold', 'cpu_utilization', '> 80%', '45%', 'warning', 'Slack #infra-alerts', 'CPU usage warning across all production services', 'active'),
      ('Memory Pressure Alert', 'all-services', 'Threshold', 'memory_utilization', '> 90%', '67%', 'critical', 'PagerDuty + Slack', 'Memory usage critical alert with OOM risk', 'active'),
      ('P99 Latency SLO Breach', 'api-gateway', 'SLO', 'http_request_duration_p99', '> 500ms', '180ms', 'critical', 'PagerDuty', 'SLO alert when P99 latency breaches 500ms target', 'active'),
      ('Disk Space Warning', 'all-nodes', 'Threshold', 'disk_usage_percent', '> 80%', '62%', 'warning', 'Slack #infra-alerts', 'Disk utilization warning before exhaustion', 'active'),
      ('Pod Restart Counter', 'all-pods', 'Counter', 'pod_restart_count', '> 3 in 10m', '0', 'warning', 'Slack #k8s-alerts', 'Alert on excessive pod restarts indicating crashes', 'active'),
      ('Database Connection Pool', 'postgres-primary', 'Threshold', 'active_connections', '> 80% of max', '45%', 'warning', 'Slack #db-alerts', 'Database connection pool saturation warning', 'active'),
      ('Kafka Consumer Lag', 'kafka-consumers', 'Threshold', 'consumer_lag_messages', '> 10000', '1250', 'warning', 'Slack #data-alerts', 'Kafka consumer lag exceeding acceptable backlog', 'active'),
      ('SSL Certificate Expiry', 'all-endpoints', 'Predictive', 'cert_days_remaining', '< 30 days', '245 days', 'info', 'Slack #security', 'Advance warning for SSL certificate renewal', 'active'),
      ('Anomaly Detection - Traffic', 'api-gateway', 'Anomaly', 'request_rate', '±3 std dev', 'Normal', 'warning', 'Slack #incidents', 'ML-based anomaly detection on traffic patterns', 'active'),
      ('SLO Error Budget Burn', 'api-gateway', 'SLO', 'error_budget_remaining', '< 50%', '78%', 'warning', 'PagerDuty', 'SLO error budget burn rate alert (monthly window)', 'active'),
      ('Node NotReady Alert', 'k8s-cluster', 'State', 'node_ready_status', 'NotReady', 'Ready', 'critical', 'PagerDuty + Slack', 'Kubernetes node health status monitoring', 'active'),
      ('Deployment Failure Alert', 'all-pipelines', 'Event', 'deploy_status', 'Failed', 'N/A', 'critical', 'Slack #deploys', 'Immediate alert on any deployment failure', 'active'),
      ('Cost Anomaly Detection', 'all-cloud', 'Anomaly', 'daily_spend', '> 120% of average', '$1,580', 'warning', 'Slack #finops', 'Cloud spend anomaly detection for unexpected cost spikes', 'active'),
      ('Uptime SLA Monitor', 'all-services', 'SLO', 'uptime_percent', '< 99.95%', '99.98%', 'critical', 'PagerDuty + Email', 'Overall platform uptime SLA monitoring (monthly)', 'active');
    `);

    // 5. Security & Compliance (15)
    await client.query(`
      INSERT INTO security_compliance (title, scan_type, target_resource, vulnerability_count, critical_count, compliance_standard, compliance_score, findings, recommendations, description, status) VALUES
      ('Container Image Scan Q1', 'Container Scan', 'All production images', 47, 3, 'CIS Benchmark', 82, '3 critical CVEs, 12 high, 32 medium', 'Update base images, remove unnecessary packages', 'Quarterly container security scan across all production images', 'in_progress'),
      ('SOC 2 Type II Audit', 'Compliance Audit', 'Full infrastructure', 0, 0, 'SOC 2 Type II', 91, '2 minor observations in access control', 'Implement MFA for all admin access, review audit logs', 'Annual SOC 2 Type II compliance audit preparation', 'in_progress'),
      ('Network Penetration Test', 'Penetration Test', 'External endpoints', 8, 1, 'OWASP Top 10', 78, '1 critical: SQL injection in legacy API', 'Patch legacy API, implement WAF rules', 'External penetration testing by third-party firm', 'open'),
      ('IAM Policy Review', 'Access Review', 'AWS IAM', 15, 4, 'Principle of Least Privilege', 72, '4 overly permissive roles, 11 unused roles', 'Restrict admin roles, remove unused IAM entities', 'Quarterly IAM permissions audit and cleanup', 'open'),
      ('Secrets Rotation Audit', 'Secret Scan', 'Vault + K8s Secrets', 6, 2, 'Internal Security Policy', 68, '2 secrets > 180 days old, 4 > 90 days', 'Implement automatic secret rotation, add alerts', 'Audit of all secrets for rotation compliance', 'open'),
      ('PCI DSS Assessment', 'Compliance Audit', 'Payment infrastructure', 5, 1, 'PCI DSS v4.0', 85, '1 critical: encryption at rest gap', 'Enable encryption for all cardholder data stores', 'PCI DSS assessment for payment processing systems', 'in_progress'),
      ('Kubernetes RBAC Audit', 'Access Review', 'K8s cluster RBAC', 12, 3, 'CIS Kubernetes', 76, '3 cluster-admin bindings to review', 'Restrict cluster-admin, implement namespace-scoped roles', 'Kubernetes RBAC configuration security audit', 'open'),
      ('Dependency Vulnerability', 'SAST/SCA', 'All repositories', 89, 7, 'CVE Database', 65, '7 critical in transitive deps', 'Update vulnerable dependencies, add Dependabot', 'Software composition analysis across all codebases', 'in_progress'),
      ('Network Segmentation', 'Network Scan', 'VPC configuration', 4, 1, 'CIS AWS Benchmark', 88, '1 overly permissive security group', 'Tighten security groups, implement micro-segmentation', 'Network segmentation and firewall rule audit', 'open'),
      ('GDPR Data Mapping', 'Compliance Audit', 'Data stores', 3, 0, 'GDPR', 90, '3 data stores missing retention policies', 'Implement data retention automation', 'GDPR personal data mapping and compliance review', 'closed'),
      ('API Security Assessment', 'API Scan', 'All REST APIs', 22, 2, 'OWASP API Top 10', 74, '2 critical auth bypass, 8 rate limit issues', 'Fix auth bypass, implement rate limiting', 'Comprehensive API security testing and assessment', 'open'),
      ('Cloud Configuration Audit', 'CSPM', 'AWS Account', 34, 5, 'CIS AWS Foundations', 79, '5 S3 buckets with risky policies', 'Enable default encryption, block public access', 'Cloud security posture management scan', 'in_progress'),
      ('Endpoint Security Check', 'Endpoint Scan', 'Developer workstations', 8, 0, 'Internal Policy', 92, 'All critical patches applied, 8 minor findings', 'Update 8 workstations with latest patches', 'Developer endpoint security compliance check', 'closed'),
      ('DR Security Assessment', 'DR Audit', 'DR infrastructure', 6, 1, 'ISO 27001', 83, '1 critical: DR backup not encrypted', 'Enable encryption for DR backups, test restore', 'Security assessment of disaster recovery infrastructure', 'open'),
      ('Supply Chain Security', 'SBOM Analysis', 'CI/CD pipeline', 11, 2, 'SLSA Level 3', 70, '2 unsigned build artifacts', 'Implement artifact signing, SBOM generation', 'Software supply chain security assessment', 'in_progress');
    `);

    // 6. Cost Optimization (15)
    await client.query(`
      INSERT INTO cost_optimization (title, cloud_provider, service_category, monthly_cost, potential_savings, optimization_type, affected_resources, recommendation, description, status) VALUES
      ('EC2 Right-Sizing', 'AWS', 'Compute', 18500.00, 4200.00, 'Right-Sizing', '14 over-provisioned instances', 'Downsize 14 instances from xlarge to large based on utilization', 'Identify and right-size over-provisioned EC2 instances', 'identified'),
      ('Reserved Instance Purchase', 'AWS', 'Compute', 24000.00, 8400.00, 'Reserved Pricing', 'All stable production workloads', 'Purchase 1-year standard RI for 35% savings on baseline', 'Convert on-demand instances to reserved instances', 'approved'),
      ('S3 Lifecycle Policies', 'AWS', 'Storage', 5100.00, 2100.00, 'Storage Tiering', 'data-lake, log-archive buckets', 'Move objects > 90 days to S3-IA, > 365 days to Glacier', 'Implement S3 lifecycle policies for cold data', 'in_progress'),
      ('Unused EBS Volumes', 'AWS', 'Storage', 890.00, 890.00, 'Waste Removal', '6 unattached EBS volumes (2.4 TB)', 'Delete 6 unattached volumes after snapshot backup', 'Remove orphaned EBS volumes from terminated instances', 'identified'),
      ('Spot Instance Migration', 'AWS', 'Compute', 6200.00, 4340.00, 'Spot Pricing', 'Batch processing, CI/CD runners', 'Migrate batch jobs and CI runners to spot instances (70% savings)', 'Use spot instances for fault-tolerant workloads', 'identified'),
      ('NAT Gateway Optimization', 'AWS', 'Networking', 4800.00, 1920.00, 'Architecture Change', '4 NAT Gateways across AZs', 'Implement VPC endpoints for S3/DynamoDB, reduce NAT traffic', 'Reduce data transfer costs through NAT Gateway', 'approved'),
      ('Dev Environment Scheduling', 'AWS', 'Compute', 3200.00, 2240.00, 'Scheduling', 'Dev/staging environments', 'Auto-shutdown dev environments 7PM-7AM and weekends', 'Schedule non-production environments for business hours only', 'implemented'),
      ('RDS Instance Optimization', 'AWS', 'Database', 8200.00, 1640.00, 'Right-Sizing', '3 RDS instances', 'Downsize 2 read replicas, enable Aurora Serverless for dev', 'Optimize RDS instance sizes and types', 'identified'),
      ('CloudWatch Log Reduction', 'AWS', 'Monitoring', 2100.00, 1050.00, 'Configuration', 'All CloudWatch log groups', 'Reduce DEBUG log retention to 7 days, set log sampling', 'Reduce CloudWatch logging costs through retention policies', 'in_progress'),
      ('Container Rightsizing', 'AWS', 'Compute', 4500.00, 1350.00, 'Right-Sizing', '45 EKS pod definitions', 'Adjust CPU/memory requests based on actual usage patterns', 'Right-size Kubernetes pod resource requests and limits', 'identified'),
      ('Data Transfer Optimization', 'AWS', 'Networking', 3800.00, 1520.00, 'Architecture Change', 'Cross-region data transfer', 'Implement CloudFront caching, reduce cross-region calls', 'Reduce data transfer costs between regions and to internet', 'approved'),
      ('Graviton Migration', 'AWS', 'Compute', 12000.00, 2400.00, 'Instance Type', '20 x86 instances', 'Migrate compatible workloads to Graviton3 for 20% savings', 'Migrate workloads to ARM-based Graviton instances', 'in_progress'),
      ('ElastiCache Optimization', 'AWS', 'Cache', 3900.00, 975.00, 'Right-Sizing', 'Redis cluster nodes', 'Reduce from r6g.xlarge to r6g.large, optimize key TTLs', 'Right-size ElastiCache Redis cluster', 'identified'),
      ('Idle Load Balancers', 'AWS', 'Networking', 450.00, 450.00, 'Waste Removal', '3 unused ALBs', 'Remove 3 ALBs with zero target groups or traffic', 'Clean up unused Application Load Balancers', 'identified'),
      ('Multi-Cloud Cost Audit', 'Multi-Cloud', 'All', 52000.00, 7800.00, 'Full Audit', 'AWS + GCP accounts', 'Comprehensive cross-cloud optimization recommendations', 'Full cloud cost audit across all providers and services', 'in_progress');
    `);

    // 7. Container Orchestration (15)
    await client.query(`
      INSERT INTO container_orchestration (title, cluster_name, orchestrator, node_count, pod_count, cpu_allocation, memory_allocation, namespace, health_status, description, status) VALUES
      ('Production EKS Cluster', 'prod-us-east-1', 'Kubernetes (EKS)', 12, 186, '62%', '71%', 'default', 'Healthy', 'Main production Kubernetes cluster in US-East-1', 'running'),
      ('Staging EKS Cluster', 'staging-us-east-1', 'Kubernetes (EKS)', 4, 48, '35%', '42%', 'staging', 'Healthy', 'Staging environment cluster for pre-production testing', 'running'),
      ('EU Production Cluster', 'prod-eu-west-1', 'Kubernetes (EKS)', 8, 124, '58%', '65%', 'default', 'Healthy', 'European production cluster for EU data residency', 'running'),
      ('ML Training Cluster', 'ml-training', 'Kubernetes (GKE)', 6, 24, '82%', '78%', 'ml-workloads', 'Healthy', 'GPU-enabled cluster for ML model training jobs', 'running'),
      ('CI/CD Runner Cluster', 'cicd-runners', 'Kubernetes (EKS)', 3, 32, '70%', '55%', 'ci-runners', 'Healthy', 'Dedicated cluster for CI/CD build and test runners', 'running'),
      ('Data Platform Cluster', 'data-platform', 'Kubernetes (EKS)', 8, 56, '55%', '68%', 'data', 'Healthy', 'Cluster for Spark, Airflow, and ETL workloads', 'running'),
      ('Edge Computing Nodes', 'edge-cluster', 'K3s', 20, 60, '40%', '35%', 'edge', 'Degraded', '3 edge nodes unreachable due to network issues', 'degraded'),
      ('Service Mesh Sidecar', 'prod-us-east-1', 'Istio', 12, 372, '8%', '12%', 'istio-system', 'Healthy', 'Istio service mesh sidecars across production cluster', 'running'),
      ('Monitoring Stack', 'monitoring', 'Docker Compose', 1, 8, '25%', '45%', 'monitoring', 'Healthy', 'Prometheus, Grafana, AlertManager deployment', 'running'),
      ('API Gateway Pods', 'prod-us-east-1', 'Kubernetes (EKS)', 12, 24, '45%', '38%', 'api-tier', 'Healthy', 'API gateway deployment with HPA scaling', 'running'),
      ('Worker Pool', 'prod-us-east-1', 'Kubernetes (EKS)', 12, 36, '65%', '72%', 'workers', 'Healthy', 'Background job processing worker deployments', 'running'),
      ('Redis Cluster (K8s)', 'prod-us-east-1', 'Kubernetes (EKS)', 12, 6, '15%', '55%', 'cache', 'Healthy', 'Redis cluster running as StatefulSet in Kubernetes', 'running'),
      ('Canary Deploy Pool', 'prod-us-east-1', 'Kubernetes (EKS)', 12, 8, '5%', '4%', 'canary', 'Healthy', 'Canary deployment pool receiving 5% traffic split', 'running'),
      ('Development Cluster', 'dev-cluster', 'minikube', 1, 22, '60%', '70%', 'development', 'Healthy', 'Local development cluster for developer testing', 'running'),
      ('Serverless Containers', 'fargate-prod', 'AWS Fargate', 0, 45, 'Auto', 'Auto', 'serverless', 'Healthy', 'Fargate serverless container tasks for event processing', 'running');
    `);

    // 8. Log Analysis (15)
    await client.query(`
      INSERT INTO log_analysis (title, source_service, log_level, time_range, log_volume, error_count, pattern_detected, anomalies, description, status) VALUES
      ('API Gateway Error Spike', 'api-gateway', 'ERROR', 'Last 24 hours', '2.4 GB', 12847, 'Connection timeout pattern', 'Error rate 3x above baseline', 'Investigating elevated error rates in API gateway logs', 'analyzed'),
      ('Auth Service Audit Trail', 'auth-service', 'INFO', 'Last 7 days', '890 MB', 23, 'Normal login patterns', 'Unusual login attempt from IP block 45.x.x.x', 'Authentication audit log analysis for security review', 'analyzed'),
      ('Database Slow Query Log', 'postgres-primary', 'WARN', 'Last 24 hours', '340 MB', 0, '15 queries > 5s execution time', 'Query plan regression in user_search', 'Analysis of PostgreSQL slow query log for optimization', 'analyzed'),
      ('Kubernetes Events Review', 'k8s-cluster', 'WARN', 'Last 48 hours', '120 MB', 45, 'OOMKilled events in worker namespace', '3 pods repeatedly OOMKilled', 'Kubernetes event log analysis for cluster health', 'analyzed'),
      ('CDN Access Log Analysis', 'cloudfront', 'INFO', 'Last 30 days', '45 GB', 0, 'Cache hit ratio: 94.2%', 'Unusual traffic from bot network', 'CloudFront access log analysis for cache optimization', 'analyzed'),
      ('Payment Processing Logs', 'payment-svc', 'ALL', 'Last 24 hours', '1.2 GB', 8, 'Timeout pattern on bank API calls', 'Bank API response time degraded', 'Payment service log analysis for transaction monitoring', 'analyzed'),
      ('Deployment Log Audit', 'ci-cd-pipeline', 'INFO', 'Last 7 days', '230 MB', 3, '47 successful deploys, 3 rollbacks', 'Rollback frequency increased', 'CI/CD deployment log analysis and audit trail', 'analyzed'),
      ('Security Event Logs', 'waf-cloudtrail', 'WARN', 'Last 24 hours', '5.6 GB', 2340, 'SQL injection attempts blocked', 'Attack volume 5x above normal', 'WAF and CloudTrail security event log analysis', 'analyzed'),
      ('Kafka Broker Logs', 'kafka-cluster', 'WARN', 'Last 48 hours', '780 MB', 12, 'Under-replicated partitions', 'Broker-3 disk latency spikes', 'Kafka broker log analysis for cluster health monitoring', 'analyzed'),
      ('Application Performance', 'all-services', 'INFO', 'Last 24 hours', '8.2 GB', 0, 'P99 latency baseline established', 'GraphQL service latency trending up', 'Cross-service application performance log analysis', 'analyzed'),
      ('Container Runtime Logs', 'containerd', 'ERROR', 'Last 24 hours', '450 MB', 78, 'Image pull failures from ECR', 'ECR rate limiting during peak deploys', 'Container runtime log analysis for node health', 'analyzed'),
      ('Load Balancer Logs', 'alb-production', 'INFO', 'Last 7 days', '12 GB', 156, '502 errors during deploys', 'Health check latency increase', 'ALB access log analysis for traffic patterns', 'analyzed'),
      ('Batch Job Execution', 'batch-etl', 'ALL', 'Last 7 days', '340 MB', 5, '3 ETL jobs exceeding SLA', 'Data volume growth affecting job duration', 'Batch processing execution log analysis', 'analyzed'),
      ('DNS Query Logs', 'route53', 'INFO', 'Last 30 days', '2.1 GB', 0, 'NXDOMAIN rate: 0.3%', 'Spike in DNS queries to deprecated endpoint', 'Route 53 DNS query log analysis for traffic routing', 'analyzed'),
      ('Service Mesh Traces', 'istio-proxy', 'INFO', 'Last 24 hours', '3.8 GB', 0, 'Inter-service call graph mapped', 'Circular dependency detected: A→B→C→A', 'Istio proxy access logs for service mesh observability', 'analyzed');
    `);

    // 9. Infrastructure as Code (15)
    await client.query(`
      INSERT INTO iac_configs (title, iac_tool, provider, resource_type, resource_count, drift_detected, last_applied, module_path, description, status) VALUES
      ('VPC & Networking', 'Terraform', 'AWS', 'Networking', 24, false, '2024-03-13 10:00:00', 'modules/networking', 'VPC, subnets, route tables, NAT gateways, and VPC endpoints', 'synced'),
      ('EKS Production Cluster', 'Terraform', 'AWS', 'Kubernetes', 18, false, '2024-03-12 14:00:00', 'modules/kubernetes/prod', 'Production EKS cluster with managed node groups and add-ons', 'synced'),
      ('RDS Database Instances', 'Terraform', 'AWS', 'Database', 8, true, '2024-03-10 09:00:00', 'modules/database', 'RDS PostgreSQL instances with read replicas and backups', 'drifted'),
      ('IAM Roles & Policies', 'Terraform', 'AWS', 'Security', 42, true, '2024-03-11 16:00:00', 'modules/security/iam', 'IAM roles, policies, and service accounts for all services', 'drifted'),
      ('S3 Buckets & Policies', 'Terraform', 'AWS', 'Storage', 15, false, '2024-03-13 08:00:00', 'modules/storage/s3', 'S3 buckets with encryption, versioning, and lifecycle rules', 'synced'),
      ('CloudFront Distributions', 'Terraform', 'AWS', 'CDN', 4, false, '2024-03-09 12:00:00', 'modules/cdn', 'CloudFront distributions with WAF integration', 'synced'),
      ('ElastiCache Redis', 'Terraform', 'AWS', 'Cache', 6, false, '2024-03-12 10:00:00', 'modules/cache', 'Redis cluster with replication and failover configuration', 'synced'),
      ('Monitoring & Alerting', 'Terraform', 'AWS', 'Monitoring', 35, false, '2024-03-13 11:00:00', 'modules/monitoring', 'CloudWatch dashboards, alarms, and SNS topics', 'synced'),
      ('CI/CD Infrastructure', 'Terraform', 'AWS', 'CI/CD', 12, false, '2024-03-11 14:00:00', 'modules/cicd', 'CodePipeline, CodeBuild projects, and ECR repositories', 'synced'),
      ('Helm Charts - Core', 'Helm', 'Kubernetes', 'Applications', 28, false, '2024-03-13 09:00:00', 'charts/core-services', 'Helm charts for core application services deployment', 'synced'),
      ('Helm Charts - Infra', 'Helm', 'Kubernetes', 'Infrastructure', 15, true, '2024-03-08 16:00:00', 'charts/infrastructure', 'Helm charts for ingress, cert-manager, external-dns', 'drifted'),
      ('GCP ML Infrastructure', 'Terraform', 'GCP', 'ML Platform', 10, false, '2024-03-12 08:00:00', 'modules/gcp/ml', 'GCP Vertex AI, GKE GPU nodes, and Cloud Storage', 'synced'),
      ('WAF & Security Groups', 'Terraform', 'AWS', 'Security', 22, true, '2024-03-07 10:00:00', 'modules/security/network', 'WAF rules, security groups, and NACLs', 'drifted'),
      ('DNS & Certificates', 'Terraform', 'AWS', 'DNS', 18, false, '2024-03-13 07:00:00', 'modules/dns', 'Route 53 zones, records, and ACM certificates', 'synced'),
      ('Kafka/MSK Cluster', 'Terraform', 'AWS', 'Messaging', 8, false, '2024-03-10 12:00:00', 'modules/messaging', 'Amazon MSK cluster with topics and consumer configurations', 'synced');
    `);

    // 10. Disaster Recovery (15)
    await client.query(`
      INSERT INTO disaster_recovery (title, dr_type, rpo_hours, rto_hours, backup_frequency, last_backup, last_drill, primary_region, dr_region, resources_covered, description, status) VALUES
      ('Primary Database DR', 'Hot Standby', 0.08, 0.25, 'Continuous replication', '2024-03-14 12:00:00', '2024-02-15 10:00:00', 'us-east-1', 'us-west-2', 'RDS PostgreSQL primary + replicas', 'Continuous replication with automatic failover for primary database', 'active'),
      ('Application Tier DR', 'Warm Standby', 0.5, 1.0, 'Real-time sync', '2024-03-14 12:00:00', '2024-02-20 14:00:00', 'us-east-1', 'us-west-2', 'EKS cluster, application deployments', 'Pre-provisioned EKS cluster in DR region with scaled-down replicas', 'active'),
      ('S3 Data Replication', 'Active-Active', 0.0, 0.0, 'Real-time CRR', '2024-03-14 12:00:00', '2024-01-30 09:00:00', 'us-east-1', 'us-west-2', 'All S3 buckets', 'Cross-region replication for all critical S3 data stores', 'active'),
      ('Redis Cache Recovery', 'Cold Standby', 6.0, 2.0, 'Every 6 hours', '2024-03-14 06:00:00', '2024-02-28 11:00:00', 'us-east-1', 'us-west-2', 'ElastiCache Redis cluster', 'Redis snapshot-based recovery with 6-hour RPO', 'active'),
      ('Kafka Event Recovery', 'Warm Standby', 1.0, 2.0, 'Continuous mirroring', '2024-03-14 12:00:00', '2024-03-01 10:00:00', 'us-east-1', 'us-west-2', 'MSK Kafka cluster', 'MirrorMaker 2 cross-region Kafka replication', 'active'),
      ('DNS Failover Config', 'Active-Passive', 0.0, 0.08, 'Real-time', '2024-03-14 12:00:00', '2024-02-15 10:00:00', 'us-east-1', 'us-west-2', 'Route 53 hosted zones', 'Automatic DNS failover with health checks and 5-minute TTL', 'active'),
      ('Secrets & Config DR', 'Active-Active', 0.0, 0.5, 'Real-time sync', '2024-03-14 12:00:00', '2024-03-05 15:00:00', 'us-east-1', 'us-west-2', 'HashiCorp Vault, ConfigMaps', 'Vault replication and ConfigMap backup to DR region', 'active'),
      ('CI/CD Pipeline DR', 'Cold Standby', 24.0, 4.0, 'Daily', '2024-03-14 02:00:00', '2024-01-15 10:00:00', 'us-east-1', 'us-west-2', 'CodePipeline, CodeBuild, ECR', 'Daily backup of CI/CD configuration and artifacts', 'active'),
      ('Monitoring DR', 'Warm Standby', 1.0, 1.0, 'Hourly', '2024-03-14 11:00:00', '2024-02-10 14:00:00', 'us-east-1', 'us-west-2', 'Prometheus, Grafana, AlertManager', 'Monitoring stack DR with metric data replication', 'active'),
      ('EBS Volume Snapshots', 'Backup', 24.0, 4.0, 'Daily', '2024-03-13 22:00:00', '2024-02-25 09:00:00', 'us-east-1', 'us-west-2', 'All EBS volumes', 'Daily EBS snapshots with cross-region copy', 'active'),
      ('Multi-Region Failover Plan', 'Active-Passive', 0.5, 4.0, 'Continuous', '2024-03-14 12:00:00', '2024-03-01 10:00:00', 'us-east-1', 'us-west-2', 'Full stack', 'Complete multi-region failover runbook and automation', 'active'),
      ('EU Region DR', 'Warm Standby', 1.0, 2.0, 'Continuous', '2024-03-14 12:00:00', '2024-02-20 10:00:00', 'eu-west-1', 'eu-central-1', 'EU production stack', 'European region disaster recovery for GDPR compliance', 'active'),
      ('Backup Verification', 'Verification', 0.0, 0.0, 'Weekly', '2024-03-10 03:00:00', '2024-03-10 03:00:00', 'us-east-1', 'us-west-2', 'All backup targets', 'Automated weekly backup integrity verification', 'active'),
      ('Chaos Engineering DR', 'Testing', 0.0, 0.0, 'Monthly', '2024-03-01 14:00:00', '2024-03-01 14:00:00', 'us-east-1', 'us-west-2', 'Production services', 'Monthly chaos engineering tests for DR validation', 'active'),
      ('Communication Plan', 'Runbook', 0.0, 0.25, 'On change', '2024-03-05 10:00:00', '2024-02-15 10:00:00', 'N/A', 'N/A', 'Stakeholder communication', 'DR communication plan with escalation matrix and templates', 'active');
    `);

    console.log('✅ Database seeded successfully with 15 items per feature!');
    console.log('📊 Tables: users, auto_scaling_policies, incident_responses, deployment_pipelines, monitoring_alerts, security_compliance, cost_optimization, container_orchestration, log_analysis, iac_configs, disaster_recovery');
    console.log('👤 Default user: admin@devops.io / password123');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
