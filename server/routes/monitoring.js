const { createCrudRoutes } = require('./routeFactory');

module.exports = createCrudRoutes(
  'monitoring_alerts',
  ['title', 'service_name', 'alert_type', 'metric_name', 'threshold_value', 'current_value', 'severity', 'notification_channel', 'description', 'status'],
  {
    systemPrompt: 'You are an expert in observability, monitoring, and alerting. Design comprehensive monitoring strategies.',
    buildPrompt: (body) => `Design a monitoring and alerting strategy for "${body.title || body.service_name || 'a service'}".
Alert type: ${body.alert_type || 'Threshold'}, Metric: ${body.metric_name || 'unknown'}, Threshold: ${body.threshold_value || 'N/A'}, Current: ${body.current_value || 'N/A'}, Severity: ${body.severity || 'warning'}.
Provide: recommended thresholds, alert routing, escalation policy, dashboard design, SLI/SLO recommendations, and runbook integration.`
  }
);
