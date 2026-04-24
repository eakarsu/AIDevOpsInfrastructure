const { createCrudRoutes } = require('./routeFactory');

module.exports = createCrudRoutes(
  'log_analysis',
  ['title', 'source_service', 'log_level', 'time_range', 'log_volume', 'error_count', 'pattern_detected', 'anomalies', 'description', 'status'],
  {
    systemPrompt: 'You are an expert in log management, analysis, and observability. Provide detailed log analysis and troubleshooting guidance.',
    buildPrompt: (body) => `Analyze logs for "${body.title || body.source_service || 'a service'}".
Source: ${body.source_service || 'unknown'}, Level: ${body.log_level || 'ALL'}, Time range: ${body.time_range || 'Last 24 hours'}, Volume: ${body.log_volume || 'unknown'}, Errors: ${body.error_count || 0}.
${body.pattern_detected ? 'Detected pattern: ' + body.pattern_detected : ''} ${body.anomalies ? 'Anomalies: ' + body.anomalies : ''}
Provide: root cause analysis, log query examples, correlation with other signals, structured logging recommendations, and alerting rules.`
  }
);
