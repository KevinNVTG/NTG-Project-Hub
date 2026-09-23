# NTG Project Hub v0.11.0 — Commercial Proposal Table Layout Fix

This patch improves all customer-facing Commercial Proposal print/PDF tables.

## Improvements
- Material Allowance Schedule uses dedicated column widths so headers do not overlap.
- Estimated Union Labor table uses dedicated ST/OT/DT/Total/Billing/Amount widths.
- Pricing schedules give descriptions more room and keep quantities/currency aligned.
- Budget, base-proposal summary, and alternates tables receive purpose-built column layouts.
- Headers may wrap cleanly instead of colliding or running off the page.
- Numeric columns remain right aligned and text columns remain left aligned.
- Print styling keeps rows together and repeats table headers when a table spans pages.

## Installation
Install after v0.10.9. No Supabase migration is required.
