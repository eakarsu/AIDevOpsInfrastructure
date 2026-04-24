const { createCrudRoutes } = require('./routeFactory');

module.exports = createCrudRoutes(
  'container_orchestration',
  ['title', 'cluster_name', 'orchestrator', 'node_count', 'pod_count', 'cpu_allocation', 'memory_allocation', 'namespace', 'health_status', 'description', 'status'],
  {
    systemPrompt: 'You are an expert Kubernetes and container orchestration architect. Provide production-ready container management recommendations.',
    buildPrompt: (body) => `Analyze container orchestration for "${body.title || body.cluster_name || 'a Kubernetes cluster'}".
Orchestrator: ${body.orchestrator || 'Kubernetes'}, Nodes: ${body.node_count || 'N/A'}, Pods: ${body.pod_count || 'N/A'}, CPU: ${body.cpu_allocation || 'N/A'}, Memory: ${body.memory_allocation || 'N/A'}, Health: ${body.health_status || 'unknown'}.
Provide: cluster optimization, resource quota recommendations, scaling strategy, security hardening, networking best practices, and health remediation steps.`
  }
);
