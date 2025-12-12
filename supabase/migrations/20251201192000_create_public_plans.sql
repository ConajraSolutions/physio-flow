-- Create public_plans table for storing exercise plans accessible via public links
CREATE TABLE public.public_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.public_plans ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for public access (since these are public links)
CREATE POLICY "Allow public read access to public_plans" ON public.public_plans 
  FOR SELECT USING (true);

-- Create policy for authenticated users to insert
CREATE POLICY "Allow authenticated insert to public_plans" ON public.public_plans 
  FOR INSERT WITH CHECK (true);

-- Create index on token for fast lookups
CREATE INDEX idx_public_plans_token ON public.public_plans(token);

