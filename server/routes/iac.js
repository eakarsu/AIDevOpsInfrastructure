const { createCrudRoutes } = require('./routeFactory');

module.exports = createCrudRoutes(
  'iac_configs',
  ['title', 'iac_tool', 'provider', 'resource_type', 'resource_count', 'drift_detected', 'last_applied', 'module_path', 'description', 'status'],
  {
    systemPrompt: 'You are an expert in Infrastructure as Code, Terraform, and cloud provisioning. Provide best-practice IaC recommendations.',
    buildPrompt: (body) => `Review Infrastructure as Code configuration for "${body.title || 'infrastructure module'}".
Tool: ${body.iac_tool || 'Terraform'}, Provider: ${body.provider || 'AWS'}, Resource type: ${body.resource_type || 'general'}, Resources: ${body.resource_count || 'N/A'}, Drift: ${body.drift_detected ? 'YES' : 'No'}.
${body.module_path ? 'Module path: ' + body.module_path : ''}
Provide: IaC best practices, module structure, drift remediation, state management tips, CI/CD integration, and security policy recommendations.`
  }
);
