const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePlan, assertTransition } = require('../domain/changeWorkflow');

test('plans are pinned, allowlisted, idempotent, and reversible', () => {
  const plan = { environment: 'sandbox', artifactDigest: `sha256:${'a'.repeat(64)}`, idempotencyKey: 'job-001', rollbackPlan: 'restore v1' };
  assert.equal(validatePlan(plan, ['sandbox']), true);
  assert.throws(() => validatePlan({ ...plan, environment: 'prod' }, ['sandbox']), /allowlisted/);
});

test('approval is independent and execution is leased', () => {
  assert.throws(() => assertTransition('planned', 'approved', { requesterId: 1, approverId: 1 }), /independent/);
  assert.throws(() => assertTransition('approved', 'running', {}), /lease/);
});
