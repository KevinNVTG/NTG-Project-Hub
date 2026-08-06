# Deployment checklist

1. Push repository files to `main`.
2. Watch GitHub checks for Supabase migration and Vercel build.
3. Confirm tables exist in Supabase: `profiles`, `company_settings`, `customers`, `projects`, `activity_log`.
4. Create Kevin and Yohen in Supabase Authentication > Users.
5. Open the Vercel production URL and sign in.
6. Add a test customer and project.
7. Confirm project number begins with `PRJ-26-0001`.

## Production domain

Add `hub.nevadatileandgranite.com` in Vercel Project Settings > Domains, then create the DNS record Vercel specifies at your domain provider.
