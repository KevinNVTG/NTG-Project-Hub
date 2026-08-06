# Clean repository replacement and deployment

## Recommended method: GitHub Desktop

1. Install GitHub Desktop and sign in to the `KevinNVTG` account.
2. Clone `KevinNVTG/NTG-Project-Hub` to your computer.
3. Delete the existing project files inside the cloned repository, but keep the hidden `.git` folder.
4. Copy **all contents** of this clean project folder into the cloned repository root.
5. In GitHub Desktop, confirm the file tree includes `app/`, `components/`, `lib/`, `public/`, `supabase/`, and `package.json` at the top level.
6. Commit with message: `Replace repository with clean NTG Project Hub v0.1`.
7. Push to `main`.

Vercel will deploy automatically, and the Supabase GitHub integration will apply the migration in `supabase/migrations/`.

## After deployment

1. In Supabase, open **Authentication > Users**.
2. Create users for:
   - `kevin@nevadatileandgranite.com`
   - `yohen@nevadatileandgranite.com`
3. Set temporary passwords.
4. Open the Vercel production URL and sign in.

## Expected repository root

```text
app/
components/
docs/
lib/
public/
supabase/
.env.example
.gitignore
eslint.config.mjs
next-env.d.ts
next.config.ts
package.json
README.md
tsconfig.json
```
