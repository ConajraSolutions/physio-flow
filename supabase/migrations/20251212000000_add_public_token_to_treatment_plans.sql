-- Add public_token column to treatment_plans table
ALTER TABLE public.treatment_plans 
ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;

-- Create index on public_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_treatment_plans_public_token ON public.treatment_plans(public_token);




