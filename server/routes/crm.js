// CRM / communication-history schema.
//
// PRODUCT-DECISION: minimal schema that matches the rest of the app
//   (snake_case columns, integer pk, `created_at TIMESTAMP DEFAULT NOW()`).
//   `donor_id` is a soft FK (no FK constraint) so this code is safe to run
//   against a partially-seeded DB; we never modify the existing donors
//   table.
// Additive only — `CREATE TABLE IF NOT EXISTS`. No ALTERs to existing
// tables.
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

const ALLOWED_TYPES = ['email', 'call', 'meeting', 'note', 'event', 'task', 'sms'];

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS donor_communications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      donor_id INTEGER,
      type VARCHAR(32) NOT NULL,
      subject TEXT,
      body TEXT,
      outcome VARCHAR(64),
      occurred_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_donor_comms_donor ON donor_communications(donor_id)`).catch(() => {});
}
ensureTable();

router.get('/', async (req, res) => {
  try {
    const { donor_id, limit = 50 } = req.query;
    const sql = donor_id
      ? 'SELECT * FROM donor_communications WHERE donor_id = $1 ORDER BY created_at DESC LIMIT $2'
      : 'SELECT * FROM donor_communications ORDER BY created_at DESC LIMIT $1';
    const params = donor_id ? [donor_id, Math.min(500, parseInt(limit, 10) || 50)] : [Math.min(500, parseInt(limit, 10) || 50)];
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list communications', details: e.message });
  }
});

router.post('/', async (req, res) => {
  const { donor_id, type, subject, body, outcome, occurred_at } = req.body || {};
  if (!type || !ALLOWED_TYPES.includes(type)) return res.status(400).json({ error: `type must be one of ${ALLOWED_TYPES.join(',')}` });
  try {
    const r = await pool.query(
      `INSERT INTO donor_communications (user_id, donor_id, type, subject, body, outcome, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user?.id || null, donor_id || null, type, subject || null, body || null, outcome || null, occurred_at || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to log communication', details: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM donor_communications WHERE id = $1 RETURNING id', [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete', details: e.message });
  }
});

module.exports = router;
