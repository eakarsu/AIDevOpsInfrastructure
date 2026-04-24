const { createCrudRoutes } = require('./routeFactory');

module.exports = createCrudRoutes(
  'security_compliance',
  ['title', 'scan_type', 'target_resource', 'vulnerability_count', 'critical_count', 'compliance_standard', 'compliance_score', 'findings', 'recommendations', 'description', 'status'],
  {
    systemPrompt: 'You are an expert in cloud security, compliance, and vulnerability management. Provide actionable security recommendations.',
    buildPrompt: (body) => `Perform a security and compliance assessment for "${body.title || 'infrastructure'}".
Scan type: ${body.scan_type || 'Full Audit'}, Target: ${body.target_resource || 'all resources'}, Standard: ${body.compliance_standard || 'CIS Benchmark'}.
${body.findings ? 'Current findings: ' + body.findings : ''}
Provide: vulnerability prioritization, remediation steps with commands, compliance gap analysis, security hardening recommendations, and timeline for fixes.`
  }
);
