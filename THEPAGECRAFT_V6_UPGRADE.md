# ThePageCraft v7 Experience Upgrade

## Public website

- Added a responsive mobile navigation menu with Home, eBooks, About, Support, Amazon and My Library access.
- Added a large Signature Collection with animated book covers, availability and pricing.
- Added an editorial manifesto section and a dedicated reader FAQ.
- Added a premium Reader Promise section focused on curated books, private library access, focused reading and support.
- Upgraded the footer into organised Explore and Account navigation groups.
- Added a global scroll-progress indicator and an animated back-to-top control.
- Redesigned payment success and payment failure screens with clearer next actions.
- Added SEO description and Open Graph metadata.
- Added visible keyboard focus, responsive image handling, selection styling and reduced-motion accessibility.

## Owner/admin panel

- Redesigned the dashboard with a live overview header, KPI cards, best-performing book bars and latest-order feed.
- Added Ctrl/Cmd + K global search across books, customers, posts and orders.
- Added persistent light and dark themes.
- Added modern toast-notification support and polished page transitions.
- Improved mobile/tablet responsiveness, card interactions and dashboard hierarchy.
- Preserved customer access grant/revoke, purchase records, book/PDF management, private PDF preview, site settings, team roles and activity logs.
- Updated the service-worker cache version so deployed users receive the new owner-panel assets.

## Deployment

1. Run `npm install` if dependencies are not installed.
2. Run `npm run build`.
3. Deploy the project to Vercel using the existing environment variables.
4. Open `/tpc-owner-261/index.html` once after deployment and refresh to activate the new cached version.
5. If the Supabase owner upgrade has not been run, execute `RUN_THIS_OWNER_UPGRADE.sql` once in the Supabase SQL Editor.

The actual Echoes of Freedom PDF was not present in the supplied ZIP. Upload it from **Owner Panel → Books / Products → Echoes of Freedom → Edit** and save it as `echoes-of-freedom.pdf` or another path linked to that product.
