# NTG Project Hub v0.12.2 — Direct CSI Labor Allocation + True Proposal Total

- Adds direct union labor allocation by CSI scope for small projects that do not use areas/phases.
- Direct scope allocations become the labor-hour source when present; otherwise area labor remains next priority, then master labor hours.
- Printed Estimated Union Labor by Scope works with either direct scope allocation or area allocation.
- Replaces the lump-sum Base Proposal Summary with a Proposal Price Summary that combines other pricing + union labor and shows a clear TOTAL PROPOSAL.
- Proposal dashboard now shows total proposal including estimated union labor.

Migration: `202610010003_proposal_scope_labor.sql`
