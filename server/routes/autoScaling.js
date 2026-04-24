const { createCrudRoutes } = require('./routeFactory');

module.exports = createCrudRoutes(
  'auto_scaling_policies',
  ['title', 'service_name', 'provider', 'min_instances', 'max_instances', 'target_cpu', 'target_memory', 'scaling_type', 'cooldown_seconds', 'current_instances', 'description', 'status'],
  {
    systemPrompt: 'You are an expert cloud infrastructure and auto-scaling architect. Provide detailed, production-ready scaling recommendations.',
    buildPrompt: (body) => `Analyze and recommend an auto-scaling policy for service "${body.title || body.service_name || 'a cloud service'}" on ${body.provider || 'AWS'}.
Current config: Min instances: ${body.min_instances || 1}, Max: ${body.max_instances || 10}, Target CPU: ${body.target_cpu || 70}%, Target Memory: ${body.target_memory || 80}%, Scaling type: ${body.scaling_type || 'Target Tracking'}.
Provide: optimal scaling thresholds, cooldown recommendations, scaling policy type analysis, cost impact, performance implications, and monitoring setup.`
  }
);
