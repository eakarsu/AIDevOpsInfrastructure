const { createCrudRoutes } = require('./routeFactory');

module.exports = createCrudRoutes(
  'incident_responses',
  ['title', 'severity', 'affected_services', 'incident_type', 'started_at', 'resolved_at', 'root_cause', 'timeline', 'remediation', 'description', 'status'],
  {
    systemPrompt: 'You are an expert SRE and incident response commander. Provide thorough incident analysis, root cause investigation, and remediation plans.',
    buildPrompt: (body) => `Analyze this incident: "${body.title || 'Service Incident'}".
Severity: ${body.severity || 'SEV-2'}, Type: ${body.incident_type || 'Service Degradation'}, Affected services: ${body.affected_services || 'unknown'}.
${body.root_cause ? 'Known root cause: ' + body.root_cause : 'Root cause not yet determined.'}
Provide: detailed root cause analysis, incident timeline, immediate remediation steps, long-term prevention measures, runbook updates, and post-incident review agenda.`
  }
);
