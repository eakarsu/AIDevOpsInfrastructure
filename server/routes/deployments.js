const { createCrudRoutes } = require('./routeFactory');

module.exports = createCrudRoutes(
  'deployment_pipelines',
  ['title', 'service_name', 'pipeline_type', 'stages', 'deploy_strategy', 'build_time', 'test_coverage', 'target_env', 'rollback_policy', 'description', 'status'],
  {
    systemPrompt: 'You are an expert CI/CD and deployment automation architect. Design robust, production-grade deployment pipelines.',
    buildPrompt: (body) => `Design or optimize a deployment pipeline for "${body.title || body.service_name || 'a microservice'}".
Current: Strategy: ${body.deploy_strategy || 'Rolling Update'}, Build time: ${body.build_time || 'unknown'}, Test coverage: ${body.test_coverage || 'unknown'}, Target: ${body.target_env || 'Production'}.
Provide: optimized pipeline stages, deployment strategy recommendation, rollback policy, testing strategy, build optimization tips, and monitoring integration.`
  }
);
