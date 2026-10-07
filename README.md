# ThePageCraft — Premium Website & Owner Control Center

Premium responsive digital bookstore with authentication, secure customer library, protected PDF reader, cart, checkout, content management and a separate owner control center.

## v8 coupons, customer profiles and promotion studio

### v8.3 clean SaaS Owner Control Center

- Admin panel rebuilt in a clean white dashboard system based on the supplied visual reference.
- Rounded application shell, slim navigation, owner profile header, orange actions, blue progress modules and green system states.
- Dashboard now includes live Store Health and Promotions gauges, Order Tracking, Publishing & Sales, Store Checklist and four quick metrics.
- Existing books, PDFs, orders, customers, coupons, promotions, notification sender, media, admin team and activity controls remain connected.
- The light layout is responsive and becomes a compact bottom-navigation experience on mobile.

### v8.2 cinematic opening experience

- Public website and Owner Control Center now open with a matching ThePageCraft brand reveal.
- The intro uses a premium editorial wordmark, TP orbit mark, animated grid, gold/violet lighting, progress rail and curtain transition.
- Website and admin have their own context label/tagline while keeping one visual identity.
- A visible Skip intro control, mobile layout and reduced-motion accessibility are included.
- This visual update needs no additional SQL or environment variable.

### v8.1 notification delivery fix

- Public homepage now has a permanent `My Notifications` section for the logged-in account.
- Admin dashboard homepage now has a quick sender with customer selector, message type, title, message, coupon and poster URL.
- Popup and homepage inbox refresh every 8 seconds and immediately when the browser tab regains focus.
- Selected-account campaigns still require the customer to be signed in with the exact email/account chosen by the admin.
- Admin static files use a new cache version so older notification code is not reused by the browser.

- Coupon Manager: create/edit/pause coupon codes, percentage or fixed discounts, minimum cart value, maximum discount, per-user/total usage limits, schedule/expiry and optional book targeting.
- Secure checkout: coupons are validated in Supabase and recalculated again inside the Razorpay server route. The browser no longer decides the payment amount.
- Customer Profiles: owner can inspect account ID, verified status, provider, join/last-login time, orders, spending, phone, city/state, language, tier, tags and private admin notes.
- Promotion Studio: send a notification, promotional poster or attached coupon to all signed-in accounts or selected users; the website displays it as a premium popup and records opens/clicks/dismissals.
- Automatic Razorpay completion: verified signatures record paid books and coupon redemptions when the server-only service-role key is configured.

### Required one-time v8 setup

1. In Supabase SQL Editor run `RUN_THIS_V8_COUPONS_CAMPAIGNS.sql` after the older owner upgrade SQL.
2. In Vercel → Project Settings → Environment Variables add `SUPABASE_SERVICE_ROLE_KEY` using the secret service-role key from Supabase Project Settings → API Keys.
3. Keep `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` server-only. Never put the service-role key in a `VITE_` variable.
4. Redeploy the project, then open `/tpc-owner-261/index.html`.

## v7 premium experience + owner-route fix

- Public website: signature book collection, editorial manifesto, reader-promise cards, FAQ, improved mobile navigation, richer footer, scroll progress, back-to-top control, SEO metadata, focus accessibility and reduced-motion support.
- Owner panel: redesigned dashboard, live KPI cards, book-performance bars, recent-order feed, Ctrl/Cmd + K global search, light/dark themes, improved responsive layout and modern visual feedback.
- Owner routing: Support-page link opens `/tpc-owner-261/index.html`; localhost redirects and Vercel rewrites prevent the public homepage from taking over the owner URL.
- Localhost startup: the public Supabase URL and publishable browser key have safe defaults, while `.env` values still override them.
- Existing Supabase authentication, purchases, access grant/revoke, private PDF storage, media manager and owner permissions are preserved.
- Direct owner panel URL: `/tpc-owner-261/index.html`.

---

## Setup (VS Code mein kaise chalayein)

### Step 1 — Node.js install karo
https://nodejs.org se LTS version download karo aur install karo.

### Step 2 — Folder VS Code mein open karo
- VS Code open karo
- File → Open Folder → `ritesh-store` folder select karo

### Step 3 — Terminal open karo
VS Code mein: `Ctrl + `` (backtick) dabao

### Step 4 — Dependencies install karo
```bash
npm install
```

### Step 5 — Website start karo
```bash
npm run dev
```

Browser mein `http://localhost:5173` open hoga — tumhari website ready!

---

## Build for production (deploy ke liye)
```bash
npm run build
```
`dist/` folder banta hai — ise Netlify, Vercel ya any hosting par upload karo.

---

## Files structure
```
ritesh-store/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx        ← Top navigation + logo
│   │   ├── Hero.jsx          ← Hero section
│   │   ├── ProductCard.jsx   ← Product cards
│   │   └── CartPanel.jsx     ← Cart + Checkout sidebar
│   ├── data/
│   │   └── products.js       ← Products list (yahan apne products add karo)
│   ├── App.jsx               ← Main app
│   └── index.css             ← Global styles
├── index.html
├── package.json
└── vite.config.js
```

## Apne products kaise add karein
`src/data/products.js` file mein products array mein naya item add karo:
```js
{
  id: 7,
  title: "Meri Nayi Book",
  category: "Business",
  price: 399,
  description: "Ek zabardast description.",
  emoji: "📚",
  badge: "New",   // ya null
}
```

## Payments
Razorpay server routes are available in `api/`. Keep the Razorpay key secret and all private credentials in Vercel environment variables—never place them in frontend source files.
# v9 Admin Tools

Run `RUN_THIS_V9_ADMIN_TOOLS.sql`, then follow `V9_SETUP_GUIDE.md` for the Theme & Appearance editor, Homepage Editor, Support Tickets and AI Content Helper.
