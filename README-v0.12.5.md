# NTG Project Hub v0.12.5 - Scope Labor Save Repair

Install after v0.12.4.

## Fixes
- Re-applies the direct CSI scope-labor database table safely even if the v0.12.2 migration was missed or did not deploy.
- Makes **Save scope hours** return to the commercial proposal instead of leaving the browser on a failed Server Action response.
- Verifies the scope-labor upsert actually returned a saved row before reporting success.
- Revalidates both the proposal editor and Print/PDF page after a successful save.

## Supabase migration
`202610010004_repair_proposal_scope_labor.sql`

This migration is idempotent and is safe even when the original v0.12.2 scope-labor table already exists.

## Suggested commit message
`Repair CSI labor allocation saving v0.12.5`
