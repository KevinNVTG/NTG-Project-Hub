# NTG Project Hub v0.9.4 — Two-Person Client Records

This update adds optional co-client support so one customer record can represent two individuals, such as a married couple, partners, or co-owners.

## What changed
- Customer records now support a primary client and an optional second client.
- Each person can have their own first name, last name, email, and phone number.
- The customer directory, project selectors, estimates, commercial proposals, and future contract conversions display joint names as `Primary Name & Second Name` when no company name is used.
- Estimate PDFs show both customer contact methods when supplied.
- New contracts created from estimates use both client names automatically.
- Contract PDFs add a second client signature/date line when the linked customer has a second individual.
- Commercial customers still prioritize the company name while preserving both individual contacts on the customer record.
- Customer search now searches both people’s names, emails, and phone numbers.

## Supabase migration
`supabase/migrations/202609210001_customer_co_clients.sql`

The migration adds:
- `co_client_first_name`
- `co_client_last_name`
- `co_client_email`
- `co_client_phone`

## Install
Copy everything inside this update folder into the NTG Project Hub repository, replace/merge when prompted, then commit and push to `main`.

Suggested commit message:

`Add two-person client records v0.9.4`

After Vercel is Ready, test by editing or creating a residential customer and filling in the Second Client section.
