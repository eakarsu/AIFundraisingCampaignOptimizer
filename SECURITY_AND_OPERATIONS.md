# Security and operations

Run `scripts/bootstrap.sh`, export `DATABASE_URL`, run `scripts/migrate.sh`, then `./start.sh`. Startup is non-destructive. Demo seeding requires explicit confirmation and an isolated database. JWT secrets have no fallback, and generated gap endpoints are quarantined from routing.

`/api/grant-workflow` persists tenant-scoped opportunities, rule versions, eligibility evidence, claims, reconciled budgets, review stages, submission receipts and stewardship state. Unsupported claims block review; approval/submission requires an authorized role; evidence stores checksums, rights basis and sensitivity; writes use optimistic versions, idempotency and immutable audit events; provider failures are durable records.

Real donor/funder portals, CRM, storage, accounting, calendar, email and research adapters require organization credentials, rights review and contract tests. Eligibility rules and deadlines need owner-maintained versioning. Beneficiary/donor privacy, authorized claims, final narratives, budgets and submissions require organizational review; no fundraising, tax, legal or grant-award outcome is guaranteed.
