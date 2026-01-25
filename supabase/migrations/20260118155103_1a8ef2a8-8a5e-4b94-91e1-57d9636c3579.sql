-- =============================================
-- 1. FIX TRANSACTIONS RLS - Restrict by user_id
-- =============================================

-- Drop existing open policies
DROP POLICY IF EXISTS "Anyone can delete transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anyone can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anyone can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anyone can view all transactions" ON public.transactions;

-- Create restrictive policies
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- 2. FIX SAVINGS TABLE - Add user_id column
-- =============================================

-- Add user_id column (nullable first for existing data)
ALTER TABLE public.savings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Drop existing open policies
DROP POLICY IF EXISTS "Anyone can view savings" ON public.savings;
DROP POLICY IF EXISTS "Anyone can update savings" ON public.savings;
DROP POLICY IF EXISTS "Anyone can insert savings" ON public.savings;

-- Create restrictive policies
CREATE POLICY "Users can view their own savings"
  ON public.savings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own savings"
  ON public.savings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings"
  ON public.savings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings"
  ON public.savings FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- 3. PREPARE CATEGORIES FOR FUTURE USER-SPECIFIC
-- =============================================
-- Add optional user_id column for future user-created categories
-- NULL = global category, UUID = user-specific category

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Drop existing open policies
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can update categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can delete categories" ON public.categories;

-- Create new policies: users can see global + their own categories
CREATE POLICY "Users can view global and their own categories"
  ON public.categories FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Only allow inserting user-specific categories (not global ones from frontend)
CREATE POLICY "Users can insert their own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own categories
CREATE POLICY "Users can update their own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own categories
CREATE POLICY "Users can delete their own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);