const TRANSITIONS = Object.freeze({
  draft: ['planned', 'cancelled'], planned: ['approved', 'draft', 'cancelled'],
  approved: ['running', 'cancelled'], running: ['succeeded', 'failed'],
  succeeded: ['rollback_pending'], failed: ['rollback_pending', 'closed'],
  rollback_pending: ['rolled_back', 'rollback_failed'],
  rolled_back: ['closed'], rollback_failed: ['rollback_pending', 'closed'],
  cancelled: [], closed: []
});

function validatePlan(plan, allowedEnvironments) {
  if (!plan || !plan.environment || !plan.artifactDigest || !plan.idempotencyKey) throw new Error('environment, artifactDigest, and idempotencyKey are required');
  if (!Array.isArray(allowedEnvironments) || !allowedEnvironments.includes(plan.environment)) throw new Error('environment is not allowlisted');
  if (!/^sha256:[a-f0-9]{64}$/i.test(plan.artifactDigest)) throw new Error('artifactDigest must be sha256 pinned');
  if (!plan.rollbackPlan) throw new Error('rollbackPlan is required');
  return true;
}

function assertTransition(from, to, context = {}) {
  if (!(TRANSITIONS[from] || []).includes(to)) throw new Error(`transition ${from} -> ${to} is not allowed`);
  if (to === 'approved' && (!context.approverId || context.approverId === context.requesterId)) throw new Error('independent signed approval required');
  if (to === 'running' && (!context.leaseToken || !context.shortLivedCredential)) throw new Error('execution lease and short-lived credential required');
  return true;
}

module.exports = { TRANSITIONS, validatePlan, assertTransition };
