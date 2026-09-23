# NTG Project Hub v0.10.8 — Unified Hybrid Labor + Enter-Key Editing Fix

Install after v0.10.7.

## What changed
- T&M and Hybrid — Allowances + T&M proposals now use the **Union / T&M Labor Billing Schedule as the single labor-rate source**.
- The duplicate Standard Labor Rate and Overtime Labor Rate inputs are hidden when the proposal basis is T&M or Hybrid.
- Union classifications continue to hold NTG customer billing rates, estimated ST/OT/DT hours, and internal wage/fringe/burden data.
- The estimated project cost and internal profitability calculations continue to use the Union / T&M Labor Billing Schedule plus proposal pricing/allowance items.
- Fixed accidental Enter-key form submissions throughout the Commercial Proposal editor. Pressing Enter while editing an input/select no longer submits the form and reloads the prior saved value. Use the visible Save/Add button when you are ready to save that section. Enter still works normally inside multi-line text areas.

## Database
No Supabase migration is required for v0.10.8.

## Suggested commit
`Unify hybrid labor rates and fix proposal editing v0.10.8`
