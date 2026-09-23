# NTG Project Hub v0.11.5 - Material Allowance Detail Restore

This incremental update restores the full customer-facing Material Allowance Schedule on commercial proposal PDFs, including allowances assigned to an Area / Phase.

Changes:
- Shows every material allowance, not only unassigned allowances.
- Adds an Area / Phase column so the casino can see where each allowance belongs.
- Shows quantity/unit, allowance unit rate, base allowance, markup percentage/dollars, and budgeted total.
- Keeps the Estimated T&M Budget by Area as a management summary.
- Clarifies that area summaries and the allowance schedule are two views of the same costs and are not double-counted.
- Totals the full allowance schedule using the same proposal allowance calculations already used elsewhere.

Install after v0.11.4.

No Supabase migration is required.
