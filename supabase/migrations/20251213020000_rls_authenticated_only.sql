-- Ensure RLS policies explicitly allow authenticated users for patients and appointments

-- Patients
DROP POLICY IF EXISTS "Patients authenticated access" ON public.patients;
CREATE POLICY "Patients authenticated access"
ON public.patients
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Appointments
DROP POLICY IF EXISTS "Appointments authenticated access" ON public.appointments;
CREATE POLICY "Appointments authenticated access"
ON public.appointments
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
