# NTG Project Hub v0.11.6 — Allowance Table Page-Fit Fix

This patch fixes the customer-facing Commercial Proposal Material Allowance Schedule so all seven columns remain inside the printable US Letter page.

## Changes
- Rebalances the 7 allowance-table columns to exactly 100% of printable width.
- Keeps Budgeted Total and markup values inside the right edge of the page.
- Allows long allowance descriptions and area names to wrap cleanly.
- Slightly tightens table typography/padding only for this schedule.
- Preserves the detailed allowance basis restored in v0.11.5.
- Does not replace global editor CSS, so the v0.11.1 editor layout repair remains intact.

No Supabase migration is required.
