# NTG Project Hub v0.8.1 - Change Order Labor & Material Line Items

Adds an optional detailed pricing section to contract-linked change orders.

## New workflow
- Keep using the existing single Change Order Amount for simple lump-sum revisions.
- For larger added scopes (for example, a shower remodel), add Labor, Material, Equipment, Allowance, or Other line items.
- Each item stores description, quantity, unit, unit price, and line total.
- Use the **Use Item Total as Change Order Amount** button when the detailed breakdown represents the full price.
- The customer-facing Print / PDF change order shows the breakdown only when items exist.
- Line items remain editable until the change order is approved; approved items are locked with the approved record.

## Install
Copy everything inside this update folder into the existing NTG Project Hub repository and replace/merge files when prompted.

Commit message:
`Add optional change order labor and material items v0.8.1`

Supabase migration:
`202609070001_change_order_line_items.sql`
