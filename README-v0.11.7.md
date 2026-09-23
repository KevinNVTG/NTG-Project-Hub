# NTG Project Hub v0.11.7 - Area Labor Rollup Fix

## What changed
- Estimated Project Cost now uses the sum of labor hours entered under Area / Phase when area labor exists.
- Estimated Union Labor table now rolls area hours up by labor classification.
- Internal profitability calculations in the proposal editor use the same area-hour rollup.
- Falls back to the master labor schedule's estimated hours when no area hours have been entered.
- Prevents the area budget and project summary from showing different labor-hour totals.

No Supabase migration is required.

Suggested commit message:
`Roll area labor hours into proposal totals v0.11.7`
