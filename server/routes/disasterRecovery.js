const { createCrudRoutes } = require('./routeFactory');

module.exports = createCrudRoutes(
  'disaster_recovery',
  ['title', 'dr_type', 'rpo_hours', 'rto_hours', 'backup_frequency', 'last_backup', 'last_drill', 'primary_region', 'dr_region', 'resources_covered', 'description', 'status'],
  {
    systemPrompt: 'You are an expert in disaster recovery planning, business continuity, and backup strategies. Provide comprehensive DR recommendations.',
    buildPrompt: (body) => `Evaluate disaster recovery plan for "${body.title || 'infrastructure'}".
DR Type: ${body.dr_type || 'Warm Standby'}, RPO: ${body.rpo_hours || 'N/A'} hours, RTO: ${body.rto_hours || 'N/A'} hours, Backup: ${body.backup_frequency || 'unknown'}.
Primary: ${body.primary_region || 'N/A'}, DR Region: ${body.dr_region || 'N/A'}, Resources: ${body.resources_covered || 'N/A'}.
Provide: DR strategy assessment, backup verification steps, failover procedures, RTO/RPO improvement recommendations, testing schedule, and communication plan.`
  }
);
