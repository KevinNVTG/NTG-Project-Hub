# NTG Project Hub v0.10 - T&M Contract + Union Labor Billing

Adds a dedicated Time & Materials contract workflow for large commercial work, including union-labor rate schedules.

## Included
- T&M contract terms instead of fixed-price wording when Pricing Basis = Time & Materials.
- Union labor toggle and project-specific union-rate notes.
- Schedule of Rates with classification, regular, overtime, double-time, and notes.
- Material, equipment, subcontractor, and other approved-cost markup fields.
- Optional mobilization charge, minimum charge, and Not-to-Exceed ceiling.
- T&M billing frequency and labor billing terms.
- Customer-facing commercial contract PDF prints the T&M compensation structure and rate schedule.
- Invoice creation includes a T&M Billing type for T&M contracts. Detailed invoice line items can be used for actual labor hours/material/equipment/subcontract costs for each billing period.

## Important union-rate handling
No generic union wage rates are hard-coded. Enter the rates applicable to the actual project/classification and agreement so the executed contract does not silently rely on an outdated rate.

## Database migration
Supabase migration: `202609210002_tm_contract_billing.sql`

## Install
Copy everything inside this update folder into the repository root, replacing/merging files when prompted. Commit and push.
Suggested commit: `Add T&M contracts union rates and billing v0.10`

## Validation note
Updated files were inspected for integration with the existing contract/invoice flows. A full local Next.js build could not be completed in the generation environment because dependency installation exceeded the available execution window; Vercel remains the authoritative deployment build check.
