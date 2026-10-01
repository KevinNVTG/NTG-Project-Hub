# NTG Project Hub v0.12.1 — Labor Print + CSI Scope Allocation

This incremental update is installed after v0.12.0.

## What changed
- Union labor now prints on Commercial Proposals whenever labor classifications exist, including Lump Sum proposals.
- If Area / Phase labor hours are entered, the print version rolls those area hours into the overall Estimated Union Labor schedule instead of relying only on the master estimate fields.
- Each Area / Phase labor row now has a CSI Scope selector so estimated hours can be allocated to 09 30 00 Tiling, 09 30 33 Stone Tiling, 12 36 40 Stone Countertops, or any custom CSI scope added to the proposal.
- The customer printout includes an Estimated Union Labor by Scope table when scope allocations are used.
- Re-adds the visible `Load NTG Union Labor — Standard` button in the labor schedule so the saved NTG commercial union billing preset can be loaded with one click.
- Internal wage/fringe/burden values remain off customer documents.

## Supabase migration
Run/apply:
`202610010002_proposal_labor_scope_assignment.sql`

## Suggested commit
`Print union labor and allocate hours by CSI scope v0.12.1`
