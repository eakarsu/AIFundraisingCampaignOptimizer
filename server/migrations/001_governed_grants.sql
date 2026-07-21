CREATE TABLE IF NOT EXISTS grant_workflows (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, opportunity_reference TEXT NOT NULL, title TEXT NOT NULL, funder TEXT NOT NULL,
  deadline TIMESTAMPTZ NOT NULL, rule_version TEXT NOT NULL, eligibility_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  narrative_claims JSONB NOT NULL DEFAULT '[]'::jsonb, budget_lines JSONB NOT NULL DEFAULT '[]'::jsonb, requested_amount NUMERIC(14,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'screening', submission_receipt TEXT, created_by BIGINT NOT NULL, approved_by BIGINT,
  idempotency_key TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id,idempotency_key), CONSTRAINT grant_stage CHECK(status IN ('screening','qualified','draft','review','approved','submitted','stewardship','closed'))
);
CREATE TABLE IF NOT EXISTS evidence_sources (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, title TEXT NOT NULL, storage_reference TEXT NOT NULL, checksum TEXT NOT NULL,
  rights_basis TEXT NOT NULL, contains_sensitive_data BOOLEAN NOT NULL DEFAULT false, approved_by BIGINT, approved_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS fundraising_integration_runs (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, provider TEXT NOT NULL, operation TEXT NOT NULL, status TEXT NOT NULL,
  external_reference TEXT, error_code TEXT, error_message TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CONSTRAINT fundraising_integration_status CHECK(status IN ('queued','succeeded','failed','manual_review'))
);
CREATE TABLE IF NOT EXISTS fundraising_audit_events (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, actor_user_id BIGINT NOT NULL, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
  before_state JSONB, after_state JSONB, request_id TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS grant_workflow_tenant_status_idx ON grant_workflows(tenant_id,status,deadline);
