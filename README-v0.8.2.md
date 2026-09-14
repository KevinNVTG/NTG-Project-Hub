# NTG Project Hub v0.8.2 - Residential & Commercial Contract Types

This update separates Residential and Commercial contracts while keeping both connected to the same project, change order, invoice, and payment workflow.

## Added
- Contract Type setting: Residential or Commercial.
- New contracts automatically default from the linked project's Project Type.
- Existing contracts linked to Commercial projects are automatically marked Commercial by the migration.
- Existing contracts can be switched between Residential and Commercial without recreating them.
- Commercial Contract PDF with commercial-specific title, scope, contract sum, billing terms, schedule, change-order language, exclusions/clarifications, insurance/licensing, warranty, and signatures.
- Residential Contract PDF remains on the existing residential format.
- Commercial billing/payment terms field.
- Commercial exclusions & clarifications field.
- Contracts list now supports Residential / Commercial filtering and displays contract type.

## Database migration
`supabase/migrations/202609140001_contract_types.sql`

## Install
Copy everything inside this update folder into the NTG Project Hub repository, merge/replace matching files, then commit and push to `main`.

Suggested commit message:
`Add residential and commercial contract types v0.8.2`

After Vercel is Ready, open a Commercial project contract and confirm the Contract Type displays Commercial. Open Print / PDF and verify the heading reads Commercial Construction Contract.
