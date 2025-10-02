-- Drop existing restrictive policies on transactions
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

-- Create open policies for all authenticated users
CREATE POLICY "Anyone can insert transactions" 
ON public.transactions 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update transactions" 
ON public.transactions 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Anyone can delete transactions" 
ON public.transactions 
FOR DELETE 
TO authenticated
USING (true);