THEPAGECRAFT OWNER ACCESS INTEGRATION

Owner console path after deployment:
https://www.thepagecraft.in/tpc-owner-261/index.html

The Support page contains a deliberately subtle THEPAGECRAFT ONLY access card under the direct-email card.
Security does not depend on hiding this link: owner password authentication and Supabase permissions still protect the console.

Owner login:
- Username is fixed internally to: meritesharma
- Login screen asks only for password
- Supabase project URL and public publishable key are already configured
- Session auto-locks after 5 minutes of inactivity

Vercel environment variables for the public site are still required:
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
PAYU_KEY
PAYU_SALT
SUPABASE_SERVICE_ROLE_KEY (server-only; never use a VITE_ prefix)

V8 first-time database setup:
Run RUN_THIS_V8_COUPONS_CAMPAIGNS.sql in Supabase SQL Editor.
