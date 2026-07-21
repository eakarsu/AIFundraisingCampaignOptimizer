const STAGES = Object.freeze(['screening', 'qualified', 'draft', 'review', 'approved', 'submitted', 'stewardship', 'closed']);

function validateBudget(lines, requestedAmount) {
  if (!Array.isArray(lines) || lines.length === 0) throw new Error('budget lines required');
  const total = lines.reduce((sum, line) => {
    const amount = Number(line.amount);
    if (!line.category || !Number.isFinite(amount) || amount < 0) throw new Error('invalid budget line');
    return sum + amount;
  }, 0);
  if (Math.abs(total - Number(requestedAmount)) > 0.005) throw new Error('budget does not reconcile to requested amount');
  return Math.round(total * 100) / 100;
}

function validateTransition(from, to, context = {}) {
  const allowed = { screening: ['qualified'], qualified: ['screening', 'draft'], draft: ['review'], review: ['draft', 'approved'], approved: ['submitted'], submitted: ['stewardship'], stewardship: ['closed'], closed: [] };
  if (!allowed[from]?.includes(to)) throw new Error('invalid grant transition');
  if (to === 'qualified' && (!context.eligibilityVersion || !context.eligibilityEvidence)) throw new Error('versioned eligibility evidence required');
  if (['review', 'approved', 'submitted'].includes(to) && Number(context.unsupportedClaims || 0) > 0) throw new Error('unsupported claims must be resolved');
  if (['approved', 'submitted'].includes(to) && !['admin', 'grants_manager', 'authorized_officer'].includes(context.role)) throw new Error('authorized approval required');
  if (to === 'submitted' && !context.submissionReceipt) throw new Error('submission receipt required');
  return true;
}

module.exports = { STAGES, validateBudget, validateTransition };
