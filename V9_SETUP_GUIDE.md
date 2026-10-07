# ThePageCraft v9 Admin Tools Setup

This update removes only the opening ThePageCraft brand intro from the public website and owner panel. The existing React `PageTransition` route animation remains enabled.

## 1. Run the database upgrade

1. Open Supabase Dashboard → SQL Editor.
2. Run the latest `RUN_THIS_V9_ADMIN_TOOLS.sql`. It is safe to run again if you used an earlier v9 copy.
3. Reload `/tpc-owner-261/`.

The script adds:

- public light/dark theme settings;
- homepage configuration and version history;
- support tickets, threaded messages, unread counts, internal notes and private attachments;
- private AI content drafts;
- RLS policies, indexes, triggers and secure customer/admin ticket functions.

## 2. Add server environment variables in Vercel

Required for AI Content Helper:

```text
OPENAI_API_KEY=your_server_only_key
OPENAI_MODEL=gpt-5.6-luna
```

Never prefix the OpenAI key with `VITE_`; that would expose it in the browser.

Optional support email notifications:

```text
RESEND_API_KEY=your_resend_key
SUPPORT_FROM_EMAIL=ThePageCraft Support <support@thepagecraft.in>
SUPPORT_EMAIL=itsritesharma261@gmail.com
```

Support tickets still work without Resend. Only email delivery remains disabled.

## 3. Admin tools added

- Theme & Appearance: separate Light/Dark palettes, HEX inputs, reset, live preview and contrast warnings.
- Homepage Editor: hero, announcement banner, featured books, text sections, visibility switches, footer, preview, draft, publish and version restore.
- Support Tickets: search/filter, unread badges, priority, status-only updates, close/reopen, customer/admin replies, signed attachment access and private internal notes.
- AI Content Helper: product descriptions, blog posts, banners, announcements, notifications, coupons, email copy, social captions and FAQs. Output is always editable and never auto-published.

## 4. Three-pass verification checklist

### Pass 1 — Safety and routing

- Website opens without the ThePageCraft text intro.
- Admin opens without the ThePageCraft text intro.
- Home/eBooks/contact/book/post route changes still use `PageTransition`.
- Existing PayU files, cart flow, authentication and protected PDF reader remain present.

### Pass 2 — Feature behaviour

- Save one Light palette and one Dark palette, refresh, then verify both persist.
- Publish homepage text, banner and featured-book changes, then refresh the public homepage.
- Create a customer ticket, reply from admin, add an internal note, close and reopen the ticket.
- Generate, edit, copy and save an AI draft.

### Pass 3 — Security and production

- Anonymous users cannot read tickets, messages, versions or AI drafts.
- Customers can read only their tickets and cannot read internal notes.
- Non-admin users receive HTTP 403 from `/api/ai-content-helper`.
- `OPENAI_API_KEY`, service-role key and email-provider key never appear in frontend source or `VITE_` variables.
- Run `npm run build` successfully before deploying.
