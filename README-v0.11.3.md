# NTG Project Hub v0.11.3 - Area Assignment Print Fix

This update prevents pricing items assigned to an Area / Phase from also appearing in the standard trade pricing schedules on the customer-facing Commercial Proposal PDF.

## Behavior
- Area-assigned regular pricing items appear only in **Estimated T&M Budget by Area**.
- Area-assigned material allowances appear only in the area breakdown, not again in the standalone Material Allowance Schedule.
- Unassigned pricing items continue to appear under their CSI trade pricing schedule or Unassigned / General Pricing.
- Unassigned allowances continue to appear in the standalone Material Allowance Schedule.
- Overall project-budget calculations are unchanged and continue to include all items exactly once.

## Install
Install after v0.11.2.

Suggested commit message:
`Prevent duplicate area-assigned proposal pricing v0.11.3`

No Supabase migration is required.
