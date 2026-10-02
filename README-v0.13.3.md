# NTG Project Hub v0.13.3

Combined update intended to be installed after v0.13.1. It includes the v0.13.2 invoice/payment layout and exact-balance payment fix plus a contract warranty-period selector.

## Included
- Keeps the v0.13.2 invoice workspace/layout improvements.
- Keeps exact-balance payment validation rounded to cents.
- Adds a Workmanship warranty selector to Contract Builder:
  - 1 year — standard warranty
  - 2 years — extended workmanship warranty
- Keeps the existing residential and commercial warranty wording; only the stated period changes.
- Defaults existing and new contracts to 1 year unless 2 years is selected.

## Database migration
Run/apply:
`supabase/migrations/202610020001_contract_warranty_period.sql`

## Suggested commit
`Add optional two-year contract warranty and invoice fixes v0.13.3`
