-- Fix permissive RLS policies for partners table
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated can manage partners" ON public.partners;

-- Create more restrictive policies for partners
CREATE POLICY "Authenticated can insert partners" ON public.partners 
FOR INSERT TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated can update partners" ON public.partners 
FOR UPDATE TO authenticated 
USING (true);

CREATE POLICY "Authenticated can delete partners" ON public.partners 
FOR DELETE TO authenticated 
USING (public.is_socio());