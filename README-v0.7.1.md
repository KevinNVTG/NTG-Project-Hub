# NTG Project Hub v0.7.1

Safe correction and voiding workflow for contract-linked change orders.

## Added
- Correct approved change orders without double-counting the contract value.
- Contract/project totals update only by the difference between the old and corrected amount.
- Required correction note recorded in the project activity log.
- Void approved or unapproved change orders while preserving the record.
- Approved COs that are voided automatically remove their financial effect from the linked contract/project.
- Print view displays correction history and clearly marks void change orders.

## Database migration
`supabase/migrations/202608310001_change_order_corrections.sql`
