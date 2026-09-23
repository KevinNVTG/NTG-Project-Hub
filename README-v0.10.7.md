# NTG Project Hub v0.10.7 — Allowance Unit Rates & Markup

This incremental update is intended to be installed after v0.10.6.

## Added
- Explicit allowance unit-rate workflow for SF, LF, EA, SLAB, and other units.
- Automatic Quantity × Allowance Unit Rate calculation.
- Optional customer-visible markup percentage on each material allowance.
- Automatic Base Allowance + Markup = Budgeted Total calculation.
- Material Allowance Schedule PDF now shows quantity/unit, unit rate, base allowance, markup, and budgeted total.
- Internal profitability/customer budget calculations now include allowance markup correctly.

## Migration
`supabase/migrations/202609230002_allowance_unit_rates_markup.sql`

## Example
2,500 SF × $8.00/SF = $20,000 base allowance
15% markup = $3,000
Budgeted allowance total = $23,000
