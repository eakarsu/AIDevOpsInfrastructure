ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE TABLE IF NOT EXISTS governed_changes (
 id BIGSERIAL PRIMARY KEY,tenant_id TEXT NOT NULL,environment TEXT NOT NULL,artifact_digest TEXT NOT NULL,idempotency_key TEXT NOT NULL,
 rollback_plan TEXT NOT NULL,summary TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'draft',requester_id BIGINT NOT NULL,approval_signature TEXT,lease_token_hash TEXT,
 version INTEGER NOT NULL DEFAULT 1,created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW(),UNIQUE(tenant_id,idempotency_key),
 CHECK(state IN('draft','planned','approved','running','succeeded','failed','rollback_pending','rolled_back','rollback_failed','cancelled','closed'))
);
CREATE TABLE IF NOT EXISTS governed_change_events(id BIGSERIAL PRIMARY KEY,change_id BIGINT NOT NULL REFERENCES governed_changes(id) ON DELETE RESTRICT,actor_id BIGINT NOT NULL,from_state TEXT,to_state TEXT NOT NULL,details JSONB NOT NULL DEFAULT '{}',created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS governed_changes_tenant_state_idx ON governed_changes(tenant_id,environment,state);
