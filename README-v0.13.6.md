# NTG Project Hub v0.13.6 — Project Invoicing Flow

Install after v0.13.5.

## Changes
- Moves multi-contract invoicing into the actual Project workflow.
- Adds a working `+ Invoice` button to the Project detail page.
- Opening Invoice from a project preselects every active contract tied to that project.
- Other contracts for the same customer can be optionally included at the invoice stage.
- Removes the standalone side-by-side Consolidated Project Invoice builder from the general New Invoice page.
- Trade damage deductions / credits are added on the actual invoice page under a dedicated Adjustments / Credits section.
- Project invoices reference each included project and contract as separate invoice line items.
- Multi-contract invoice creation no longer fails if the optional `invoice_contract_links` table is temporarily unavailable.
- Adds invoice-item source references so future final-balance calculations can correctly account for amounts billed on a combined/project invoice.

## Supabase migration
`202610070002_project_invoice_line_references.sql`

The migration safely adds optional source contract/project references to invoice line items.
