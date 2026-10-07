# NTG Project Hub v0.13.7 — Payment Corrections

Install after v0.13.6.

## What changed
- Existing invoice payments can now be edited.
- Payment amount, date, method, reference number, and notes can be corrected.
- Incorrect payments can be deleted after a confirmation prompt.
- Invoice status, amount paid, and balance due are recalculated automatically after edits or deletions.
- Payment corrections/removals are written to the project activity log for accountability.
- Paid invoices can be corrected if the payment itself was entered incorrectly; void invoices remain protected.

## Database
No Supabase migration is required.

## Suggested commit
`Add invoice payment editing and deletion v0.13.7`
