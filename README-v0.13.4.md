# NTG Project Hub v0.13.4 - Stylesheet Restore

Emergency front-end repair after v0.13.3 accidentally replaced the complete global stylesheet with only the invoice-specific CSS additions.

## Fixes
- Restores the full v0.13.0 enterprise UI stylesheet.
- Preserves the v0.13.2/v0.13.3 invoice workspace refinements.
- Does not alter database schema, server actions, warranty settings, invoice/payment logic, proposal logic, or project data.

## Install
Copy the contents of this update into the repository and replace the matching file.
Commit message:

`Restore Project Hub enterprise stylesheet v0.13.4`

No Supabase migration is required.
