const router = require('express').Router();
const crypto = require('crypto');
const pool = require('../db');
const auth = require('../middleware/auth');
const { validateBudget, validateTransition } = require('../domain/grantWorkflow');
router.use(auth);
const tenant = (req) => String(req.user.organization_id || req.user.tenant_id || `personal-${req.user.id}`);

router.get('/', async (req, res, next) => {
  try { const result = await pool.query('SELECT * FROM grant_workflows WHERE tenant_id=$1 ORDER BY deadline,created_at DESC', [tenant(req)]); res.json(result.rows); } catch (error) { next(error); }
});

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const key = req.get('idempotency-key'); if (!key) throw new Error('Idempotency-Key header is required');
    for (const field of ['opportunity_reference','title','funder','deadline','rule_version','requested_amount']) if (!req.body[field]) throw new Error(`${field} is required`);
    validateBudget(req.body.budget_lines, req.body.requested_amount);
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO grant_workflows(tenant_id,opportunity_reference,title,funder,deadline,rule_version,eligibility_evidence,narrative_claims,budget_lines,requested_amount,idempotency_key,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(tenant_id,idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING *`,
      [tenant(req), req.body.opportunity_reference, req.body.title, req.body.funder, req.body.deadline, req.body.rule_version, JSON.stringify(req.body.eligibility_evidence || []), JSON.stringify(req.body.narrative_claims || []), JSON.stringify(req.body.budget_lines), req.body.requested_amount, key, req.user.id]
    );
    await client.query('INSERT INTO fundraising_audit_events(tenant_id,actor_user_id,action,entity_type,entity_id,after_state,request_id) VALUES($1,$2,$3,$4,$5,$6,$7)', [tenant(req), req.user.id, 'grant.created', 'grant_workflow', String(result.rows[0].id), result.rows[0], req.get('x-request-id') || crypto.randomUUID()]);
    await client.query('COMMIT'); res.status(201).json(result.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); res.status(400).json({ error: error.message }); } finally { client.release(); }
});

router.post('/:id/transition', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT * FROM grant_workflows WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, tenant(req)]);
    const grant = found.rows[0]; if (!grant) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'grant workflow not found' }); }
    const unsupportedClaims = (grant.narrative_claims || []).filter((claim) => !claim.evidence_source_id || claim.review_status !== 'approved').length;
    validateTransition(grant.status, req.body.status, { role: req.user.role, eligibilityVersion: grant.rule_version, eligibilityEvidence: grant.eligibility_evidence?.length, unsupportedClaims, submissionReceipt: req.body.submission_receipt || grant.submission_receipt });
    const result = await client.query(`UPDATE grant_workflows SET status=$1,submission_receipt=COALESCE($2,submission_receipt),approved_by=CASE WHEN $1='approved' THEN $3 ELSE approved_by END,version=version+1,updated_at=NOW() WHERE id=$4 AND tenant_id=$5 AND version=$6 RETURNING *`, [req.body.status, req.body.submission_receipt || null, req.user.id, grant.id, tenant(req), Number(req.body.version)]);
    if (!result.rows[0]) throw new Error('version conflict');
    await client.query('INSERT INTO fundraising_audit_events(tenant_id,actor_user_id,action,entity_type,entity_id,before_state,after_state,request_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [tenant(req), req.user.id, 'grant.transitioned', 'grant_workflow', String(grant.id), grant, result.rows[0], req.get('x-request-id') || crypto.randomUUID()]);
    await client.query('COMMIT'); res.json(result.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); res.status(409).json({ error: error.message }); } finally { client.release(); }
});

router.post('/evidence', async (req, res, next) => {
  try {
    for (const field of ['title','storage_reference','checksum','rights_basis']) if (!req.body[field]) return res.status(400).json({ error: `${field} is required` });
    if (!/^[a-f0-9]{64}$/i.test(req.body.checksum)) return res.status(400).json({ error: 'checksum must be SHA-256' });
    const result = await pool.query('INSERT INTO evidence_sources(tenant_id,title,storage_reference,checksum,rights_basis,contains_sensitive_data) VALUES($1,$2,$3,$4,$5,$6) RETURNING *', [tenant(req), req.body.title, req.body.storage_reference, req.body.checksum, req.body.rights_basis, Boolean(req.body.contains_sensitive_data)]); res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.post('/integration-runs', async (req, res, next) => {
  try {
    if (!req.body.provider || !req.body.operation || !['queued','succeeded','failed','manual_review'].includes(req.body.status)) return res.status(400).json({ error: 'provider, operation, and valid status required' });
    if (req.body.status === 'failed' && !req.body.error_code) return res.status(400).json({ error: 'error_code required' });
    const result = await pool.query('INSERT INTO fundraising_integration_runs(tenant_id,provider,operation,status,external_reference,error_code,error_message) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *', [tenant(req), req.body.provider, req.body.operation, req.body.status, req.body.external_reference || null, req.body.error_code || null, req.body.error_message || null]); res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});
module.exports = router;
