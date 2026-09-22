# NTG Project Hub v0.10.5 — Commercial Proposal Pricing Layout Fix

This patch fixes the commercial proposal pricing editor so line-item fields no longer extend off the right side of the page.

Changes:
- Pricing line items wrap into readable rows instead of forcing a very wide single row.
- Description fields get extra width.
- CSI, type, quantity, unit, unit price, alternate controls, totals, and action buttons remain visible inside the card.
- Add Pricing Item button stays on-screen.
- Layout adapts cleanly for laptop, tablet, and mobile widths.
- No database migration required.

Install after v0.10.4 by merging/replacing the included files in the repository.
