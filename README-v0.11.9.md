# NTG Project Hub v0.11.9 — Stone Tiling CSI Scope

Adds a dedicated CSI / MasterFormat scope for natural stone installed on floors and walls in Commercial Proposals.

## New CSI preset
- **09 30 33 — Stone Tiling**
- Intended for natural stone tiling at floors and walls.
- Separate from **12 36 40 — Stone Countertops**.
- Existing **09 30 00 — Tiling** remains available for general tile work.

## Commercial Proposal trade-scope choices
- Tile only — 09 30 00
- Stone flooring & walls — 09 30 33
- Stone countertops only — 12 36 40
- Tile + stone flooring/walls
- Tile + stone countertops
- Stone flooring/walls + countertops
- Tile + stone flooring/walls + countertops

New proposals automatically add the matching CSI sections and default scope language. CSI codes, titles, and scope language remain editable so the project manual can control when it specifies a different section.

## Migration
`202610010001_stone_tiling_proposal_scope.sql`

Install after v0.11.8.
