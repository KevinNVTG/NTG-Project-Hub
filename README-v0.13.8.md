# NTG Project Hub v0.13.8 - Invoice Line Item Layout Fix

Install after v0.13.7.

## Changes
- Rebuilds invoice line-item editor layout to prevent totals, delete controls, and unit-price fields from overlapping.
- Places each line total in a dedicated footer below its editable fields.
- Keeps Save Changes and Delete as separate, clearly positioned actions.
- Separates Add Charge and Add Deduction / Credit into clean blocks.
- Improves responsive behavior on narrower laptop/tablet screens.
- Does not change invoice calculations, payments, database schema, or print/PDF output.

No Supabase migration.

Suggested commit:
`Fix invoice line item editor layout v0.13.8`
