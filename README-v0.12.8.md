# NTG Project Hub v0.12.8 — Form Save + Contract Value Stability Fix

## Fixes

### 1. Enter no longer wipes unsaved edits
Inside authenticated Project Hub editing forms, pressing Enter in a normal text/number/select field no longer accidentally submits the whole form. This was causing server-rendered values to reload before the user intentionally clicked Save/Update.

- Textareas still accept Enter for new lines.
- Save/Update buttons still work normally.
- GET/search forms keep Enter-to-search behavior.
- Users should make edits, then click the section's Save/Update button.

### 2. Completing/closing a project no longer resets contract value
The project update action previously wrote `contract_amount: 0` every time project details/status were saved. This meant changing a project to Complete, Closed, On Hold, etc. could erase the displayed contract value.

v0.12.8 removes that write. Project status/details updates now preserve the existing project contract amount.

## Install
Install after v0.12.7.

Commit message:
`Fix form enter behavior and preserve project contract value v0.12.8`

No Supabase migration is required.
