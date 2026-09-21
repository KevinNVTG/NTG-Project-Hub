# NTG Project Hub v0.10.3 - Separate Tile & Stone Commercial Proposal Scopes

This is an incremental update. Install it after v0.10.2 (or after the same features are already present in your repository).

## What changed
- Commercial proposals now have a Trade Scope choice:
  - Tile only - CSI 09 30 00 Tiling
  - Stone countertops only - CSI 12 36 40 Stone Countertops
  - Tile + Stone - both scopes kept separate inside one proposal
- Stone countertop preset is now 12 36 40 - Stone Countertops.
- CSI codes and scope wording remain editable per proposal so project specifications can override the default.
- When Tile + Stone is selected, the proposal creates both CSI sections automatically.
- Pricing is separated by CSI section with an individual subtotal for Tile and Stone.
- A Base Proposal Summary shows each trade subtotal plus the combined proposal total.
- Optional "separate trade sheets" starts the second trade on a new printed/PDF page for a cleaner bid package.
- The print heading is simplified to "Scope of Work" while still displaying each CSI code prominently.

## Database migration
`supabase/migrations/202609210004_tile_stone_proposal_scopes.sql`

The migration is safe to run once through the existing Supabase/GitHub migration workflow.
