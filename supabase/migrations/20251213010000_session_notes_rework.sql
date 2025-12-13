-- Phase 2 core schema changes

-- Rename session_summaries -> session_notes (preserve data)
ALTER TABLE public.session_summaries
RENAME TO session_notes;

-- Add temporary draft marker
ALTER TABLE public.session_notes
ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN NOT NULL DEFAULT true;

-- Optional performance index for version lookups
CREATE INDEX IF NOT EXISTS idx_session_notes_session_version
ON public.session_notes(session_id, version DESC);

-- Enforce one session per appointment
ALTER TABLE public.sessions
ADD CONSTRAINT IF NOT EXISTS sessions_appointment_id_unique
UNIQUE (appointment_id);

-- Enforce one treatment plan per session
ALTER TABLE public.treatment_plans
ADD CONSTRAINT IF NOT EXISTS treatment_plans_session_id_unique
UNIQUE (session_id);

-- Security tightening: only authenticated clinicians can read/write patients and appointments
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Remove permissive public access if it exists
DROP POLICY IF EXISTS "Allow all access to patients" ON public.patients;
DROP POLICY IF EXISTS "Allow all access to appointments" ON public.appointments;

-- Authenticated access policies (read/write)
CREATE POLICY "Patients authenticated access"
ON public.patients
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Appointments authenticated access"
ON public.appointments
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
