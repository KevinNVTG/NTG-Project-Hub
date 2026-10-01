# NTG Project Hub v0.12.3 - Commercial Proposal 404 Fix

Fixes a 404 regression introduced when direct CSI labor allocation was added in v0.12.2.

## What changed
- Commercial proposal editor no longer depends on the new `commercial_proposal_scope_labor` relationship being available inside the main Supabase nested query.
- Print/PDF page uses the same migration-safe loading pattern.
- Existing proposals remain accessible even if the v0.12.2 migration has not applied yet or Supabase relationship metadata has not refreshed.
- Direct CSI labor allocation still works when the table is available.
- The editor shows a clear warning if the scope-labor table is not yet available, rather than returning a 404.

## Install
Copy these files over the existing repository, commit, and push.

Suggested commit message:
`Fix commercial proposal 404 after scope labor update v0.12.3`

No new Supabase migration is included. The v0.12.2 migration is still required for direct CSI labor allocation.
