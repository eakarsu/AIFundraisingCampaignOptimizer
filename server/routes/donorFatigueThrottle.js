const express = require('express');

const router = express.Router();

function throttle(input = {}) {
  const emails = Number(input.emails_30d ?? 9);
  const texts = Number(input.texts_30d ?? 3);
  const gifts = Number(input.gifts_12m ?? 2);
  const lastGiftDays = Number(input.days_since_last_gift ?? 46);
  const fatigue = Math.min(100, Math.round(emails * 6 + texts * 8 + Math.max(0, 45 - lastGiftDays) * 0.8 - gifts * 5));
  return {
    donor_segment: input.donor_segment || 'mid-level recurring donors',
    fatigue_score: fatigue,
    throttle: fatigue >= 70 ? 'suppress_appeals' : fatigue >= 45 ? 'reduce_frequency' : 'normal_cadence',
    next_best_touch: fatigue >= 70 ? 'impact-only update' : 'personalized ask with soft deadline',
    cadence_rules: [
      'Block monetary asks for 14 days after two unanswered appeals.',
      'Swap third appeal in a week for stewardship content.',
      'Allow urgent campaign override only for high-affinity donors with recent positive engagement.',
    ],
  };
}

router.get('/', (req, res) => res.json(throttle()));
router.post('/score', (req, res) => res.json(throttle(req.body || {})));

module.exports = router;
