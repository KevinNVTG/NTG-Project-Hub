# NTG Project Hub v0.9 - Commercial Proposal Suite

Major commercial estimating/proposal upgrade for Nevada Tile & Granite.

## New capabilities
- Dedicated **Commercial Proposals** module with automatic `CP-YY-####` numbering.
- Three proposal depths: **Compact**, **Standard**, and **Detailed**.
- CSI / MasterFormat-formatted scope sections with a reusable preset library.
- Pricing schedule supporting Labor, Material, Equipment, Subcontract, Allowance, and Other.
- Base bid plus optional alternates.
- Proposal references for drawings, specifications, and addenda.
- Custom inclusions, exclusions, clarifications, assumptions, schedule, payment terms, warranty, insurance/bonding, closeout, and notes.
- Customer-facing professional Letter-size proposal PDF/print layout matching NTG Project Hub styling.
- Commercial pricing / contract basis selector:
  - Lump Sum / Stipulated Sum
  - Time & Materials (T&M)
  - Unit Price
  - Cost Plus Fee
  - Guaranteed Maximum Price (GMP)
  - Not-to-Exceed (NTE)
- T&M / cost-based rate fields for labor, overtime, material markup, equipment markup, subcontractor markup, Cost Plus fee, NTE ceiling, and GMP amount.
- **Proposal Settings** page for default language, default format, default pricing basis, validity, and CSI scope presets.
- Adds the same pricing-basis selector to the existing Contract Builder.

## CSI note
The software provides CSI/MasterFormat-style section organization. The project manual/specification book remains the controlling source for the exact section number and title on each project.

## Migration
`supabase/migrations/202609160001_commercial_proposals.sql`
