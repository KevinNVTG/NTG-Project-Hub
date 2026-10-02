# NTG Project Hub v0.12.9

Fixes two confirmed issues:

1. Project Contract Amount now saves the value actually entered in the project form instead of ignoring the field and reloading the previously stored value.
2. Enter-key behavior is safer and more predictable: on simple edit forms with one Save button, Enter submits that form using the current input values; on complex multi-action forms, Enter does not trigger an arbitrary action and leaves the typed value intact.

No Supabase migration is required.

Commit message:
Fix project contract value saving and Enter behavior v0.12.9
