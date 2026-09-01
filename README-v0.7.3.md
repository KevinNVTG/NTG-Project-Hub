# NTG Project Hub v0.7.3 - Change Order Correction UI Fix

This update makes correction of approved change orders explicit and reliable.

## What changed
- Approved change orders now show a prominent **Correct Approved Change Order** button.
- Clicking it opens a dedicated **Correction Mode** on the same change order.
- Approved fields stay read-only until correction mode is intentionally opened.
- Correction mode allows amount, scope, revision date, schedule impact, payment terms, and title to be corrected.
- A correction note is required.
- The linked contract/project is adjusted only by the difference between the old and new CO amount.
- Approved records are detected using both status and `approved_at` for better compatibility with existing records.
- Void workflow remains available and separate from clerical corrections.

## Database migration
`supabase/migrations/202608310002_change_order_correction_reliability.sql`
