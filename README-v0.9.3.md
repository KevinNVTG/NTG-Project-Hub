# NTG Project Hub v0.9.3 - Sidebar Scroll Fix

This patch fixes the desktop left navigation when the menu becomes taller than the browser window.

## Changes
- The left sidebar now scrolls independently from the page on desktop.
- Keeps the NTG sidebar fixed/sticky while allowing access to all navigation items.
- Adds a subtle navy-compatible scrollbar.
- Prevents horizontal overflow in the sidebar.
- Preserves the existing mobile sidebar behavior.

## Install
Copy the contents of this update into the NTG Project Hub repository and replace matching files.

Suggested commit message:
`Fix sidebar navigation scrolling v0.9.3`

No Supabase migration is required.
