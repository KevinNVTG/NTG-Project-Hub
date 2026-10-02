# NTG Project Hub v0.13.0 — Enterprise UI Refinement

Install after v0.12.9.

## Goals
This is a UI/UX refinement release intended to make Project Hub read more like a mature general-contractor operations platform while preserving existing application logic and customer-facing print/PDF layouts.

## Included
- Reworked Command Center with compact KPI cards, management-focused project activity, and cleaner quick actions.
- Project creation moved above the Project Directory and reorganized into a compact multi-column intake form.
- Project Directory expanded full width with cleaner project/customer/type/status/value/action hierarchy.
- Customer creation moved above the Customer Directory with a cleaner multi-column form and more readable contact directory.
- Estimate register and Commercial Proposal register updated to a consistent enterprise table pattern.
- Company Settings redesigned into an identity/profile panel plus configuration links.
- Sidebar grouped into Operations, Financial, and Administration sections.
- Header/top bar reduced in height and visual weight.
- Shared screen-only style system added for cards, forms, badges, tables, financial values, detail editors, project tabs, invoice forms, contract/change-order financial strips, and commercial proposal editors.
- Dashboard/summary numbers reduced substantially in size and given supporting context instead of oversized standalone figures.
- Responsive layouts tightened for laptop/tablet/mobile use.
- Print/PDF styles are intentionally excluded from the enterprise UI override so existing customer documents are not restyled or broken.

## Database
No Supabase migration is required.

## Verification
A dependency install was attempted for a full local Next.js build, but the install timed out in the build environment. The update is limited to page/component markup and screen-only CSS; no database schema or server action logic is changed.
