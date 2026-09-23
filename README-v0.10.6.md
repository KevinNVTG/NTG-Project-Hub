# NTG Project Hub v0.10.6 — Hybrid Allowance + T&M / Union Profitability

This incremental update is intended to be installed after v0.10.5.

## Added

- New **Hybrid — Allowances + T&M** commercial proposal pricing basis.
- Reusable **Union / T&M Labor Billing Schedule** by labor classification.
- Separate customer billing rates for straight time, overtime and double time.
- Separate INTERNAL fields for actual union wage, fringe/benefits and other payroll burden.
- Estimated straight-time / overtime / double-time hours by labor classification.
- INTERNAL projected customer billing, internal estimated cost, projected gross profit and projected gross margin.
- INTERNAL unit cost on commercial proposal pricing items for material/equipment/subcontract/allowance profitability analysis.
- Customer-facing **Estimated Project Cost — Budgetary** with an optional manual override and editable disclaimer.
- Material Allowance Schedule prints separately from normal pricing when allowance items are used.
- Client labor schedule displays **NTG billing rates only**. Actual union wages, fringe, burden and internal margin never appear on the customer PDF.
- Toggle to hide the NTG billing-rate schedule from the customer PDF when a project requires summary pricing only.
- Hybrid Allowance + T&M executive-summary preset.
- Hybrid pricing basis available as a Company Settings default.

## Important pricing behavior

The customer-facing labor rates are NTG billing rates. Enter your actual union wage/fringe/burden only in the orange INTERNAL fields. Those internal fields are used for profitability calculations and are intentionally excluded from the print/PDF template.

The Estimated Project Cost is labeled budgetary. For T&M/hybrid work, final billing remains controlled by actual authorized hours/costs, agreed billing rates/markups, and allowance reconciliation unless the executed agreement states otherwise.

## Database migration

`supabase/migrations/202609230001_hybrid_tm_allowance_profitability.sql`

## Suggested commit

`Add hybrid allowance T&M profitability tools v0.10.6`
