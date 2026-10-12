-- Non-destructive, idempotent top-up seed for primary domain tables.
-- Every primary table to >= 15 rows. No DELETE/UPDATE. Unique keys use ON CONFLICT;
-- governed_change_events and ai_insights use NOT EXISTS marker guards.

-- ai_insights
INSERT INTO ai_insights (resource_type, resource_id, prompt_summary, response_text, model_used, tokens_estimate, user_id)
SELECT (ARRAY['deployment_pipeline','container_orchestration','monitoring_alert','incident_response','iac_config'])[1 + (i % 5)],
       i, 'seed-prompt-' || i, 'Seed AI insight response for resource ' || i,
       'anthropic/claude-haiku-4.5', 500 + i * 17, 1
FROM generate_series(1, 15) i
WHERE NOT EXISTS (SELECT 1 FROM ai_insights a WHERE a.prompt_summary = 'seed-prompt-' || i);

-- governed_changes (unique: tenant_id, idempotency_key)
INSERT INTO governed_changes (tenant_id, environment, artifact_digest, idempotency_key, rollback_plan, summary, state, requester_id, approval_signature, lease_token_hash, version)
SELECT 'runtime-tenant',
       (ARRAY['production','staging','development'])[1 + (i % 3)],
       'sha256:' || lpad(to_hex(i * 2246822519), 48, '0'),
       'seed-change-' || lpad(i::text, 3, '0'),
       'Rollback by redeploying previous release ' || i,
       'Seed governed change ' || i,
       (ARRAY['draft','planned','approved','running','succeeded','failed','rolled_back','closed','draft','approved','succeeded','closed','planned','succeeded','closed'])[i],
       1, 'sig-' || lpad(i::text, 3, '0'), 'lease-' || i, 1
FROM generate_series(1, 15) i
ON CONFLICT (tenant_id, idempotency_key) DO NOTHING;

-- governed_change_events (FK -> governed_changes; guard by details marker)
INSERT INTO governed_change_events (change_id, actor_id, from_state, to_state, details)
SELECT c.id, 1, 'draft', c.state, jsonb_build_object('seed', 'seed-event-' || c.id, 'note', 'seeded transition')
FROM governed_changes c
WHERE c.idempotency_key LIKE 'seed-change-%'
  AND NOT EXISTS (SELECT 1 FROM governed_change_events e WHERE e.details->>'seed' = 'seed-event-' || c.id);
