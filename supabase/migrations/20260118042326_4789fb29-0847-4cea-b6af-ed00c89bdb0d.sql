-- Create function for updating timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create partner_commissions table to track commission payments
CREATE TABLE public.partner_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL,
  reference_month DATE NOT NULL,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_commissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view partner commissions"
ON public.partner_commissions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert partner commissions"
ON public.partner_commissions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update partner commissions"
ON public.partner_commissions
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can delete partner commissions"
ON public.partner_commissions
FOR DELETE
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_partner_commissions_updated_at
BEFORE UPDATE ON public.partner_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();