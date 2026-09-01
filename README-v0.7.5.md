# NTG Project Hub v0.7.5 - Nevada Date Fix (Complete)

This release removes remaining UTC-based document-date defaults and adds a visible contract control to reset an existing contract to the current Nevada/Pacific calendar date.

## Fixes
- Contract creation uses `America/Los_Angeles` calendar date.
- Contract save fallback uses Nevada date.
- Estimate creation and New Estimate form use Nevada date.
- Purchase Order creation and New PO form use Nevada date.
- Change Order revision-date fallback uses Nevada date.
- Existing contracts get a **Set effective date to Nevada today** control.
- The Contract Builder displays the current Nevada date next to the effective-date field for easy verification.

No existing legal document dates are changed automatically. Use the reset button only on a contract whose date needs correction.
