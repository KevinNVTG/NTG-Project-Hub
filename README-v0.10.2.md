# NTG Project Hub v0.10.2 - Cumulative Recovery Update

This package combines the final code state of the following incremental releases, in the correct order:

- v0.9.4 Two-Person Client Records
- v0.9.5 Client Billing Address -> Project Address autofill
- v0.10 T&M Contracts, Union Labor Rates and T&M Billing
- v0.10.1 Reusable Material Allowances

Use this package if those releases were installed out of order or some were skipped. Copy the contents of this folder into the repository root and replace/merge existing files.

This package intentionally includes all three database migrations from those releases:

- `202609210001_customer_co_clients.sql`
- `202609210002_tm_contract_billing.sql`
- `202609210003_material_allowances.sql`

Supabase migration tracking should prevent already-applied migrations from being applied twice. Do not rename these migration files.

Suggested commit message:

`Apply cumulative v0.10.2 recovery update`

After pushing to `main`, wait for both Supabase migration checks and Vercel deployment to complete before using the new features.
