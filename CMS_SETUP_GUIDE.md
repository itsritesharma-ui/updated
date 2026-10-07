# ThePageCraft Public Site — CMS Ready

This version keeps the existing public design and adds a Supabase-backed content layer for **Books / Products** and **Daily Posts**.

## What changed

- `src/context/ContentContext.jsx` fetches public products and published Daily Posts from Supabase.
- The site keeps the existing local `products.js` and `dailyPosts.js` as a fallback if the CMS tables are not ready or temporarily unavailable.
- Hero, eBooks page, search, Daily Post widget and full post routing use the shared CMS data.
- Supabase Realtime listens for changes to `products` and `daily_posts`, so an open website can refresh its content after an admin save without a redeploy.
- Existing authentication and PayU API files are preserved.

## One-time setup

1. Run `THEPAGECRAFT_CMS_SETUP.sql` in the same Supabase project used by the site.
2. Deploy this project once to your existing public Vercel project.
3. Keep these existing Vercel variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
PAYU_KEY
PAYU_SALT
```

4. Deploy the separate ThePageCraft Admin app and use it for future post/product changes.

After the CMS migration is live, normal content edits no longer require changing `src/data/products.js` or `src/data/dailyPosts.js`.
