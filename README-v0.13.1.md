# NTG Project Hub v0.13.1 - Build Fix

This patch fixes the v0.13.0 Vercel build failure:

`Module not found: Can't resolve '@/components/delete-project-button'`

The enterprise Projects page imports the existing safe-delete component, but the v0.13.0 update package did not include that component file. This patch restores it.

## Install
Copy the contents of this patch into the repository root and replace/merge when prompted.

Commit message:
`Fix v0.13.0 missing project delete component v0.13.1`

No Supabase migration is required.
