# NTG Project Hub v0.8.3 - Print / PDF Scale Fix

This update normalizes all customer-facing print layouts to US Letter size so PDFs saved from Chrome/Edge no longer appear overly zoomed-in or cropped.

## Updated document types
- Estimates
- Residential contracts
- Commercial contracts
- Change orders
- Purchase orders
- Invoices

## What changed
- Uses a true Letter page with controlled print margins.
- Removes zero-margin print rules that could cause browser scaling problems.
- Forces every printable sheet to remain inside the printable page width.
- Prevents long text, tables, addresses, and summary grids from expanding the PDF wider than the page.
- Keeps NTG document colors when printing/saving to PDF.

There is no Supabase migration for this update.

After deployment, use Ctrl+F5 once before testing a PDF so your browser loads the newest stylesheet.
