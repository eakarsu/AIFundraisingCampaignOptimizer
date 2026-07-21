const test = require('node:test');
const assert = require('node:assert/strict');
const { validateBudget, validateTransition } = require('../domain/grantWorkflow');

test('reconciles a governed grant budget', () => assert.equal(validateBudget([{ category: 'people', amount: 75 }, { category: 'travel', amount: 25 }], 100), 100));
test('rejects unreconciled budgets', () => assert.throws(() => validateBudget([{ category: 'people', amount: 75 }], 100), /reconcile/));
test('prevents submission without authority, reviewed claims, and receipt', () => {
  assert.throws(() => validateTransition('approved', 'submitted', { role: 'authorized_officer', unsupportedClaims: 0 }), /receipt/);
  assert.equal(validateTransition('approved', 'submitted', { role: 'authorized_officer', unsupportedClaims: 0, submissionReceipt: 'portal-42' }), true);
});
