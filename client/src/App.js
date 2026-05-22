import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import CICDAgentsPage from './pages/CICDAgentsPage';
import AINewToolsPage from './pages/AINewToolsPage';
import SloErrorBudgetBurn from './pages/SloErrorBudgetBurn';
import Navbar from './components/Navbar';
import './App.css';

// // === Batch 02 Gaps & Frontend Mounts ===
import CfPredictiveInfrastructureScaling from './pages/CfPredictiveInfrastructureScaling';
import CfAnomalyDetection from './pages/CfAnomalyDetection';
import CfCostOptimizationAutomation from './pages/CfCostOptimizationAutomation';
import CfFailurePrediction from './pages/CfFailurePrediction';
import CfSecurityPostureAutomation from './pages/CfSecurityPostureAutomation';
import GapMissingOptimizeInfrastructurePredictPerformanceDetectA from './pages/GapMissingOptimizeInfrastructurePredictPerformanceDetectA';
import GapLimitedCloudPlatformIntegrationNoAwsGcpAzureSdkAdap from './pages/GapLimitedCloudPlatformIntegrationNoAwsGcpAzureSdkAdap';
import GapLimitedRealTimeAlertingAndIncidentResponseAutomation from './pages/GapLimitedRealTimeAlertingAndIncidentResponseAutomation';
import GapNoSlaTrackingModule from './pages/GapNoSlaTrackingModule';
import GapNoChangeManagementWorkflow from './pages/GapNoChangeManagementWorkflow';
import GapNoSmsNotifications from './pages/GapNoSmsNotifications';
import GapNoCalendarIntegration from './pages/GapNoCalendarIntegration';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

const FEATURES = [
  { key: 'auto-scaling', label: 'Auto-Scaling', icon: '📈', color: '#3FB950', apiPath: '/api/auto-scaling', description: 'AI-powered auto-scaling policies and resource management' },
  { key: 'incidents', label: 'Incident Response', icon: '🚨', color: '#F85149', apiPath: '/api/incidents', description: 'AI incident detection, analysis, and automated response' },
  { key: 'deployments', label: 'Deployment Agents', icon: '🚀', color: '#58A6FF', apiPath: '/api/deployments', description: 'AI-optimized CI/CD pipelines and deployment strategies' },
  { key: 'monitoring', label: 'Monitoring & Alerts', icon: '📊', color: '#A371F7', apiPath: '/api/monitoring', description: 'Intelligent monitoring, alerting, and observability' },
  { key: 'security', label: 'Security & Compliance', icon: '🛡️', color: '#F0883E', apiPath: '/api/security', description: 'AI security scanning, vulnerability management, compliance' },
  { key: 'cost-optimization', label: 'Cost Optimization', icon: '💰', color: '#3FB950', apiPath: '/api/cost-optimization', description: 'Cloud cost analysis and AI-driven optimization' },
  { key: 'containers', label: 'Container Orchestration', icon: '🐳', color: '#388BFD', apiPath: '/api/containers', description: 'Kubernetes cluster management and container insights' },
  { key: 'log-analysis', label: 'Log Analysis', icon: '📋', color: '#D29922', apiPath: '/api/log-analysis', description: 'AI-powered log analysis, patterns, and anomaly detection' },
  { key: 'iac', label: 'Infrastructure as Code', icon: '🏗️', color: '#79C0FF', apiPath: '/api/iac', description: 'Terraform/IaC management, drift detection, best practices' },
  { key: 'disaster-recovery', label: 'Disaster Recovery', icon: '🔄', color: '#F85149', apiPath: '/api/disaster-recovery', description: 'DR planning, backup management, and failover automation' },
  { key: 'cicd-agents', label: 'CI/CD Agents', icon: '🤖', color: '#E94560', apiPath: '/api/cicd-agents', description: 'AI agents for failure analysis, pipeline optimization, security scanning' },
  { key: 'ai-new-tools', label: 'AI New Tools', icon: '✨', color: '#E94560', apiPath: '/api/ai', description: 'Stateless scaling and security risk advisors' },
];

const FEATURE_FIELDS = {
  'auto-scaling': [
    { name: 'title', label: 'Policy Name', type: 'text', required: true },
    { name: 'service_name', label: 'Service Name', type: 'text' },
    { name: 'provider', label: 'Cloud Provider', type: 'text' },
    { name: 'min_instances', label: 'Min Instances', type: 'number' },
    { name: 'max_instances', label: 'Max Instances', type: 'number' },
    { name: 'target_cpu', label: 'Target CPU %', type: 'number' },
    { name: 'target_memory', label: 'Target Memory %', type: 'number' },
    { name: 'scaling_type', label: 'Scaling Type', type: 'select', options: ['Target Tracking', 'Step Scaling', 'Predictive', 'Schedule Based', 'Custom Metric', 'Queue Length', 'Consumer Lag'] },
    { name: 'cooldown_seconds', label: 'Cooldown (sec)', type: 'number' },
    { name: 'current_instances', label: 'Current Instances', type: 'number' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['active', 'paused'] },
  ],
  incidents: [
    { name: 'title', label: 'Incident Title', type: 'text', required: true },
    { name: 'severity', label: 'Severity', type: 'select', options: ['SEV-1', 'SEV-2', 'SEV-3'] },
    { name: 'affected_services', label: 'Affected Services', type: 'text' },
    { name: 'incident_type', label: 'Incident Type', type: 'select', options: ['Service Outage', 'Performance Degradation', 'Database Failover', 'Security Incident', 'Configuration Error', 'Failed Deployment', 'Infrastructure Failure', 'Network Issue', 'Resource Exhaustion', 'Resource Constraint', 'CI/CD Issue', 'Container Failure', 'Processing Delay'] },
    { name: 'started_at', label: 'Started At', type: 'text' },
    { name: 'resolved_at', label: 'Resolved At', type: 'text' },
    { name: 'root_cause', label: 'Root Cause', type: 'textarea' },
    { name: 'timeline', label: 'Timeline', type: 'textarea' },
    { name: 'remediation', label: 'Remediation', type: 'textarea' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['investigating', 'mitigating', 'resolved'] },
  ],
  deployments: [
    { name: 'title', label: 'Pipeline Name', type: 'text', required: true },
    { name: 'service_name', label: 'Service Name', type: 'text' },
    { name: 'pipeline_type', label: 'Pipeline Type', type: 'select', options: ['CI/CD', 'ML Ops', 'Migration', 'IaC', 'Security', 'Testing', 'Analysis'] },
    { name: 'stages', label: 'Stages', type: 'textarea' },
    { name: 'deploy_strategy', label: 'Deploy Strategy', type: 'select', options: ['Canary', 'Blue-Green', 'Rolling Update', 'Shadow Deploy', 'Expand-Contract', 'Progressive Rollout', 'Replace', 'Progressive Regional'] },
    { name: 'build_time', label: 'Build Time', type: 'text' },
    { name: 'test_coverage', label: 'Test Coverage', type: 'text' },
    { name: 'target_env', label: 'Target Environment', type: 'text' },
    { name: 'rollback_policy', label: 'Rollback Policy', type: 'textarea' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['active', 'paused'] },
  ],
  monitoring: [
    { name: 'title', label: 'Alert Name', type: 'text', required: true },
    { name: 'service_name', label: 'Service Name', type: 'text' },
    { name: 'alert_type', label: 'Alert Type', type: 'select', options: ['Threshold', 'SLO', 'Anomaly', 'Counter', 'State', 'Event', 'Predictive'] },
    { name: 'metric_name', label: 'Metric Name', type: 'text' },
    { name: 'threshold_value', label: 'Threshold', type: 'text' },
    { name: 'current_value', label: 'Current Value', type: 'text' },
    { name: 'severity', label: 'Severity', type: 'select', options: ['critical', 'warning', 'info'] },
    { name: 'notification_channel', label: 'Notification Channel', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['active', 'paused'] },
  ],
  security: [
    { name: 'title', label: 'Assessment Title', type: 'text', required: true },
    { name: 'scan_type', label: 'Scan Type', type: 'select', options: ['Container Scan', 'Compliance Audit', 'Penetration Test', 'Access Review', 'Secret Scan', 'SAST/SCA', 'Network Scan', 'API Scan', 'CSPM', 'Endpoint Scan', 'DR Audit', 'SBOM Analysis'] },
    { name: 'target_resource', label: 'Target Resource', type: 'text' },
    { name: 'vulnerability_count', label: 'Vulnerabilities', type: 'number' },
    { name: 'critical_count', label: 'Critical Count', type: 'number' },
    { name: 'compliance_standard', label: 'Compliance Standard', type: 'text' },
    { name: 'compliance_score', label: 'Compliance Score', type: 'number' },
    { name: 'findings', label: 'Findings', type: 'textarea' },
    { name: 'recommendations', label: 'Recommendations', type: 'textarea' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['open', 'in_progress', 'closed'] },
  ],
  'cost-optimization': [
    { name: 'title', label: 'Optimization Title', type: 'text', required: true },
    { name: 'cloud_provider', label: 'Cloud Provider', type: 'select', options: ['AWS', 'GCP', 'Azure', 'Multi-Cloud'] },
    { name: 'service_category', label: 'Service Category', type: 'select', options: ['Compute', 'Storage', 'Database', 'Networking', 'Cache', 'Monitoring', 'CI/CD', 'All'] },
    { name: 'monthly_cost', label: 'Monthly Cost ($)', type: 'number' },
    { name: 'potential_savings', label: 'Potential Savings ($)', type: 'number' },
    { name: 'optimization_type', label: 'Optimization Type', type: 'select', options: ['Right-Sizing', 'Reserved Pricing', 'Spot Pricing', 'Storage Tiering', 'Waste Removal', 'Architecture Change', 'Scheduling', 'Instance Type', 'Configuration', 'Full Audit'] },
    { name: 'affected_resources', label: 'Affected Resources', type: 'text' },
    { name: 'recommendation', label: 'Recommendation', type: 'textarea' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['identified', 'approved', 'in_progress', 'implemented'] },
  ],
  containers: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'cluster_name', label: 'Cluster Name', type: 'text' },
    { name: 'orchestrator', label: 'Orchestrator', type: 'text' },
    { name: 'node_count', label: 'Node Count', type: 'number' },
    { name: 'pod_count', label: 'Pod Count', type: 'number' },
    { name: 'cpu_allocation', label: 'CPU Allocation', type: 'text' },
    { name: 'memory_allocation', label: 'Memory Allocation', type: 'text' },
    { name: 'namespace', label: 'Namespace', type: 'text' },
    { name: 'health_status', label: 'Health Status', type: 'select', options: ['Healthy', 'Degraded', 'Unhealthy'] },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['running', 'degraded', 'stopped'] },
  ],
  'log-analysis': [
    { name: 'title', label: 'Analysis Title', type: 'text', required: true },
    { name: 'source_service', label: 'Source Service', type: 'text' },
    { name: 'log_level', label: 'Log Level', type: 'select', options: ['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG'] },
    { name: 'time_range', label: 'Time Range', type: 'text' },
    { name: 'log_volume', label: 'Log Volume', type: 'text' },
    { name: 'error_count', label: 'Error Count', type: 'number' },
    { name: 'pattern_detected', label: 'Pattern Detected', type: 'textarea' },
    { name: 'anomalies', label: 'Anomalies', type: 'textarea' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['analyzing', 'analyzed'] },
  ],
  iac: [
    { name: 'title', label: 'Config Title', type: 'text', required: true },
    { name: 'iac_tool', label: 'IaC Tool', type: 'select', options: ['Terraform', 'Helm', 'Pulumi', 'CloudFormation', 'Ansible'] },
    { name: 'provider', label: 'Provider', type: 'select', options: ['AWS', 'GCP', 'Azure', 'Kubernetes'] },
    { name: 'resource_type', label: 'Resource Type', type: 'text' },
    { name: 'resource_count', label: 'Resource Count', type: 'number' },
    { name: 'drift_detected', label: 'Drift Detected', type: 'checkbox' },
    { name: 'last_applied', label: 'Last Applied', type: 'text' },
    { name: 'module_path', label: 'Module Path', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['synced', 'drifted', 'pending'] },
  ],
  'disaster-recovery': [
    { name: 'title', label: 'DR Plan Title', type: 'text', required: true },
    { name: 'dr_type', label: 'DR Type', type: 'select', options: ['Hot Standby', 'Warm Standby', 'Cold Standby', 'Active-Active', 'Active-Passive', 'Backup', 'Verification', 'Testing', 'Runbook'] },
    { name: 'rpo_hours', label: 'RPO (hours)', type: 'number' },
    { name: 'rto_hours', label: 'RTO (hours)', type: 'number' },
    { name: 'backup_frequency', label: 'Backup Frequency', type: 'text' },
    { name: 'last_backup', label: 'Last Backup', type: 'text' },
    { name: 'last_drill', label: 'Last DR Drill', type: 'text' },
    { name: 'primary_region', label: 'Primary Region', type: 'text' },
    { name: 'dr_region', label: 'DR Region', type: 'text' },
    { name: 'resources_covered', label: 'Resources Covered', type: 'textarea' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['active', 'paused', 'testing'] },
  ],
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  const handleLogin = (t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <Router>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} features={FEATURES} />
        <main className="main-content">
          <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

            <Route path="/" element={<Dashboard features={FEATURES} token={token} />} />
            {FEATURES.filter(f => f.key !== 'cicd-agents' && f.key !== 'ai-new-tools').map(f => (
              <Route key={f.key} path={`/${f.key}`} element={
                <FeaturePage feature={f} fields={FEATURE_FIELDS[f.key]} token={token} />
              } />
            ))}
            <Route path="/cicd-agents" element={<CICDAgentsPage token={token} />} />
            <Route path="/ai-new-tools" element={<AINewToolsPage token={token} />} />
            <Route path="/slo-error-budget-burn" element={<SloErrorBudgetBurn token={token} />} />
            <Route path="*" element={<Navigate to="/" />} />
          
        {/* // === Batch 02 Gaps & Frontend Mounts === */}
        <Route path="/cf/predictive-infrastructure-scaling" element={<CfPredictiveInfrastructureScaling />} />
        <Route path="/cf/anomaly-detection" element={<CfAnomalyDetection />} />
        <Route path="/cf/cost-optimization-automation" element={<CfCostOptimizationAutomation />} />
        <Route path="/cf/failure-prediction" element={<CfFailurePrediction />} />
        <Route path="/cf/security-posture-automation" element={<CfSecurityPostureAutomation />} />
        <Route path="/gap/missing-optimize-infrastructure-predict-performance-detect-a" element={<GapMissingOptimizeInfrastructurePredictPerformanceDetectA />} />
        <Route path="/gap/limited-cloud-platform-integration-no-aws-gcp-azure-sdk-adap" element={<GapLimitedCloudPlatformIntegrationNoAwsGcpAzureSdkAdap />} />
        <Route path="/gap/limited-real-time-alerting-and-incident-response-automation" element={<GapLimitedRealTimeAlertingAndIncidentResponseAutomation />} />
        <Route path="/gap/no-sla-tracking-module" element={<GapNoSlaTrackingModule />} />
        <Route path="/gap/no-change-management-workflow" element={<GapNoChangeManagementWorkflow />} />
        <Route path="/gap/no-sms-notifications" element={<GapNoSmsNotifications />} />
        <Route path="/gap/no-calendar-integration" element={<GapNoCalendarIntegration />} />
      </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
