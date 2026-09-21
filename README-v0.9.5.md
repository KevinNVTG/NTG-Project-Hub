# NTG Project Hub v0.9.5 — Project Address Autofill

This update adds a convenience option to project creation:

- Select an existing customer.
- Check **Use client billing address as project address**.
- The saved customer billing address is copied into the Project Address field.
- If you switch customers while the option is enabled, the address updates to the newly selected customer's billing address.
- You can still edit the project address manually for jobsites that differ from the billing address.
- If a customer does not have a billing address saved, the option is disabled and the form explains why.

No Supabase migration is required.

Suggested commit message:

`Add client billing address project autofill v0.9.5`
