# NTG Project Hub v0.9.1 — Commercial Proposal Build Fix

Fixes strict TypeScript nullability errors in the new Commercial Proposal pages.

## Fixed
- New Commercial Proposal page now safely handles Supabase returning `null` for project rows.
- Commercial Proposal list safely handles a `null` proposal result.
- Proposal Settings safely handles a `null` CSI preset result.

No database migration is required.
