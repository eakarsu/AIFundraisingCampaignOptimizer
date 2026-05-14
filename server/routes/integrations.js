// External integrations gated on env vars.
//
// Required env vars:
//   STRIPE        — STRIPE_SECRET_KEY
//   SENDGRID      — SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
//   MAILCHIMP     — MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID, MAILCHIMP_DC (data center, e.g. us20)
//   GRANTS_GOV    — GRANTS_GOV_API_KEY (grants.gov Search2 v2 requires no key for read,
//                   but we treat it as required so the same dispatch convention holds)
//   CANDID        — CANDID_API_KEY (Foundation Directory Online / Essentials API)
//   SAM_GOV       — SAM_GOV_API_KEY (api.sam.gov)
//
// Each endpoint returns 503 + `{ missing: [...] }` if creds are unset.
// When creds ARE present, current implementation returns a stub `200`
// describing what would be called; replace with real SDK before going
// live.
const router = require('express').Router();
const auth = require('../middleware/auth');

router.use(auth);

function missingEnv(...keys) {
  return keys.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
}

// POST /api/integrations/stripe/checkout-session
// Body: { amount_cents, currency?, donor_email?, campaign_id? }
router.post('/stripe/checkout-session', (req, res) => {
  const { amount_cents } = req.body || {};
  if (!amount_cents || typeof amount_cents !== 'number' || amount_cents < 50) {
    return res.status(400).json({ error: 'amount_cents (number >= 50) required' });
  }
  const missing = missingEnv('STRIPE_SECRET_KEY');
  if (missing.length > 0) return res.status(503).json({ error: 'Stripe not configured', missing });
  res.json({
    created: false,
    reason: 'stub',
    note: 'stub: replace with stripe.checkout.sessions.create({ mode: "payment", line_items: [...] })',
    amount_cents,
  });
});

// POST /api/integrations/sendgrid/send
// Body: { to, subject, body }
router.post('/sendgrid/send', (req, res) => {
  const { to, subject, body } = req.body || {};
  if (!to || !subject || !body) return res.status(400).json({ error: 'to, subject, body required' });
  const missing = missingEnv('SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL');
  if (missing.length > 0) return res.status(503).json({ error: 'SendGrid not configured', missing });
  res.json({ dispatched: false, reason: 'stub', note: 'stub: replace with @sendgrid/mail send' });
});

// POST /api/integrations/mailchimp/subscribe
// Body: { email, merge_fields? }
router.post('/mailchimp/subscribe', (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email required' });
  const missing = missingEnv('MAILCHIMP_API_KEY', 'MAILCHIMP_LIST_ID', 'MAILCHIMP_DC');
  if (missing.length > 0) return res.status(503).json({ error: 'Mailchimp not configured', missing });
  res.json({ subscribed: false, reason: 'stub', note: 'stub: POST https://{dc}.api.mailchimp.com/3.0/lists/{list}/members' });
});

// GET /api/integrations/grants-gov/search?q=...
router.get('/grants-gov/search', (req, res) => {
  const missing = missingEnv('GRANTS_GOV_API_KEY');
  if (missing.length > 0) return res.status(503).json({ error: 'grants.gov not configured', missing });
  const q = req.query.q || '';
  res.json({ results: [], reason: 'stub', query: q, note: 'stub: POST https://api.grants.gov/v1/api/search2' });
});

// GET /api/integrations/candid/funder?ein=...
router.get('/candid/funder', (req, res) => {
  const { ein } = req.query;
  if (!ein) return res.status(400).json({ error: 'ein query required' });
  const missing = missingEnv('CANDID_API_KEY');
  if (missing.length > 0) return res.status(503).json({ error: 'Candid not configured', missing });
  res.json({ funder: null, reason: 'stub', ein, note: 'stub: GET https://api.candid.org/essentials/v3/{ein}' });
});

// GET /api/integrations/sam-gov/opportunities?q=...
router.get('/sam-gov/opportunities', (req, res) => {
  const missing = missingEnv('SAM_GOV_API_KEY');
  if (missing.length > 0) return res.status(503).json({ error: 'SAM.gov not configured', missing });
  res.json({ opportunities: [], reason: 'stub', note: 'stub: GET https://api.sam.gov/opportunities/v2/search' });
});

module.exports = router;
