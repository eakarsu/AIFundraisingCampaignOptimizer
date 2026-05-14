// Board / committee management.
//
// PRODUCT-DECISION:
//   - Three-table model: board_members, committees, committee_memberships.
//   - All additive (`CREATE TABLE IF NOT EXISTS`).
//   - committees has a free-form `committee_type` (development, finance,
//     governance, audit, marketing) — defaulted from a small allow-list,
//     not enforced as a CHECK constraint to keep the schema tolerant.
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS board_members (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      title VARCHAR(255),
      term_start DATE,
      term_end DATE,
      bio TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS committees (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      committee_type VARCHAR(64) DEFAULT 'governance',
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS committee_memberships (
      id SERIAL PRIMARY KEY,
      committee_id INTEGER,
      board_member_id INTEGER,
      role VARCHAR(64) DEFAULT 'member',
      joined_at DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
}
ensureTables();

router.get('/members', async (req, res) => {
  try { const r = await pool.query('SELECT * FROM board_members ORDER BY created_at DESC'); res.json(r.rows); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/members', async (req, res) => {
  const { name, email, title, term_start, term_end, bio } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const r = await pool.query(
      `INSERT INTO board_members (name, email, title, term_start, term_end, bio) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, email || null, title || null, term_start || null, term_end || null, bio || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/committees', async (req, res) => {
  try { const r = await pool.query('SELECT * FROM committees ORDER BY name'); res.json(r.rows); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/committees', async (req, res) => {
  const { name, committee_type, description } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const r = await pool.query(
      `INSERT INTO committees (name, committee_type, description) VALUES ($1, $2, $3) RETURNING *`,
      [name, committee_type || 'governance', description || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/memberships', async (req, res) => {
  const { committee_id, board_member_id, role } = req.body || {};
  if (!committee_id || !board_member_id) return res.status(400).json({ error: 'committee_id, board_member_id required' });
  try {
    const r = await pool.query(
      `INSERT INTO committee_memberships (committee_id, board_member_id, role) VALUES ($1, $2, $3) RETURNING *`,
      [committee_id, board_member_id, role || 'member']
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
