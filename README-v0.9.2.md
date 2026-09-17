# NTG Project Hub v0.9.2 — Workflow & Payment Terms Cleanup

This update streamlines the workflow so pricing is established in the estimate/proposal and payment terms are established in the contract.

## Changes

- Removes **Contract Amount** from the Create Project form. New projects start at $0 and receive their value later through the estimate/contract workflow.
- Removes **Payment Terms** from new estimates, estimate editing, and estimate PDFs.
- Stops copying estimate payment terms into contracts.
- Changes the default residential contract payment schedule to:
  - 25% due upon project mobilization
  - 25% due upon completion of 50% of the scope of work
  - Remaining balance due upon completion of the scope of work
- Adds contract payment-schedule presets:
  - 25 / 25 / Balance
  - 50 / 50
  - 30 / 30 / 40
  - Four × 25%
- Presets automatically recalculate milestone dollar amounts using the current contract price and can still be edited afterward.

No Supabase migration is required. Existing estimates/contracts remain intact; this only changes the workflow and available controls.
