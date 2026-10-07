-- Run this in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor

-- 1. Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id   INT NOT NULL,          -- matches product id in products.js (1, 2, 3)
  status       TEXT NOT NULL DEFAULT 'paid',  -- 'paid' | 'refunded'
  amount       INT,                   -- amount in INR paise (e.g. 12900 = ₹129)
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 2. Row Level Security — users can only see their own purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Only admins/service role can insert (you'll insert from backend/webhook after payment)
CREATE POLICY "Service role inserts"
  ON purchases FOR INSERT
  WITH CHECK (true);  -- tighten this once you have a payment backend

-- 3. (Optional) To manually add a purchase for testing:
-- INSERT INTO purchases (user_id, product_id, status, amount)
-- VALUES ('<paste-user-uuid-here>', 1, 'paid', 12900);
