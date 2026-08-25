# NTG Project Hub v0.6 - Stone Slab Pricing Library

Adds a reusable Stone Slab Pricing setting that integrates directly with Estimates.

## Included
- Stone Slab Pricing Library under Company Settings
- Customer-facing Estimate Price per slab
- Optional Internal Cost per slab
- Material type, supplier, color/manufacturer, SKU, slab size, notes, and active/inactive status
- Presentable slab cards with pricing summary
- Add a saved slab directly to any Estimate Builder
- Quantity selection and optional estimate-price override
- Slab selection becomes a normal Material line item on the estimate and therefore appears naturally on the existing customer-facing estimate PDF

## Database
Supabase migration:
`supabase/migrations/202608250001_stone_slab_pricing.sql`
