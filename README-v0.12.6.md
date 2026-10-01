# NTG Project Hub v0.12.6

## Scope labor persistence + print table cleanup

This update fixes direct CSI labor allocation without relying on the new `commercial_proposal_scope_labor` table.

### What changed
- Direct CSI labor hours now save through the already-established proposal Area Labor tables.
- A hidden system area is created for each CSI scope. These system rows never appear in the normal Area / Phase editor or customer PDF.
- The same union classification can be allocated to multiple CSI scopes.
- Saved hours persist after refresh and feed the proposal labor totals and proposal price summary.
- The prior "Direct CSI labor allocation is not active yet" warning is removed.
- The customer PDF now uses a cleaner 4/5-column Union Labor by Scope table instead of the crowded 7-column layout.
- The overall union labor table is also simplified to Classification, Estimated Hours, Billing Rates (when shown), and Estimated Labor.

### Database
No Supabase migration is required for v0.12.6.
The older v0.12.2/v0.12.5 scope-labor migrations may remain in the repository; this update no longer depends on that table for direct CSI allocation.

### Commit message
`Fix scope labor saving and clean union labor tables v0.12.6`
