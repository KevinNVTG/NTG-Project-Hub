# NTG Project Hub v0.11.4 - Area Assignment Save Fix

This patch fixes pricing/material items reverting to their previous Area / Phase assignment after Save.

## What changed
- Area assignment is now saved through its own dedicated action instead of being mixed into the full pricing-item edit form.
- The save verifies that Supabase actually persisted the selected area.
- After saving, the page reloads directly back to that pricing item so the newly saved assignment is immediately visible.
- General pricing-item edits no longer overwrite or clear the saved area assignment.

## Install
Install after v0.11.3.

Commit message:
`Fix proposal area assignment persistence v0.11.4`

No new Supabase migration is required.
