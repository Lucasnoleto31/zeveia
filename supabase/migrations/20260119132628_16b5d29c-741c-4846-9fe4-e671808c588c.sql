-- Add lost_at column to leads table for tracking when leads are marked as lost
ALTER TABLE public.leads 
ADD COLUMN lost_at timestamp with time zone;