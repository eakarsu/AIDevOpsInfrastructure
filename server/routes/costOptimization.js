const { createCrudRoutes } = require('./routeFactory');

module.exports = createCrudRoutes(
  'cost_optimization',
  ['title', 'cloud_provider', 'service_category', 'monthly_cost', 'potential_savings', 'optimization_type', 'affected_resources', 'recommendation', 'description', 'status'],
  {
    systemPrompt: 'You are an expert FinOps practitioner and cloud cost optimization specialist. Provide data-driven cost reduction recommendations.',
    buildPrompt: (body) => `Analyze cloud costs and recommend optimizations for "${body.title || 'cloud infrastructure'}".
Provider: ${body.cloud_provider || 'AWS'}, Category: ${body.service_category || 'Compute'}, Monthly cost: $${body.monthly_cost || 'unknown'}, Optimization type: ${body.optimization_type || 'general'}.
${body.affected_resources ? 'Resources: ' + body.affected_resources : ''}
Provide: detailed savings breakdown, implementation steps, risk assessment, ROI analysis, and implementation priority order.`
  }
);
