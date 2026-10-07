# NTG Project Hub v0.13.5 — Consolidated Project Invoices

Adds customer-level consolidated invoicing for multiple project/contracts, designed for cases such as one residence with separate bathroom and flooring project records.

## New
- Consolidated Project Invoice option under Create Invoice.
- Select two or more project/contracts belonging to the same customer.
- Each selected project and contract is referenced on the invoice and PDF.
- Automatically creates one invoice line per selected project's remaining uninvoiced contract balance.
- Optional Trade Damage Deduction at invoice creation.
- Add additional deductions/credits later from the invoice detail screen.
- Deductions print as negative credits and reduce Invoice Total / Balance Due.
- Existing single-contract, milestone, change-order, T&M, progress and final invoice workflows remain unchanged.

## Database
Apply migration:
`202610070001_consolidated_project_invoices.sql`

## Install
Copy/merge this update after v0.13.4 and push to main.
