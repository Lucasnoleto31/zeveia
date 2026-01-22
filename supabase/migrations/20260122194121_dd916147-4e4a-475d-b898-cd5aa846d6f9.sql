-- Allow socios to delete profiles
CREATE POLICY "Socios can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (is_socio());