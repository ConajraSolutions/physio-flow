-- Create exercises library table
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  body_area TEXT NOT NULL,
  goal TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  instructions TEXT,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  insurance_provider TEXT,
  insurance_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinician_name TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  appointment_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  condition TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sessions table (clinical sessions)
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  clinician_name TEXT NOT NULL,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'in-progress',
  transcript TEXT,
  clinician_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session summaries table (SOAP notes)
CREATE TABLE public.session_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  full_summary TEXT,
  edit_type TEXT NOT NULL DEFAULT 'initial',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create treatment plans table
CREATE TABLE public.treatment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create treatment plan exercises (junction table)
CREATE TABLE public.treatment_plan_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  sets INTEGER,
  reps INTEGER,
  duration_seconds INTEGER,
  frequency TEXT NOT NULL DEFAULT 'daily',
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plan_exercises ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now (will tighten with auth later)
CREATE POLICY "Allow all access to exercises" ON public.exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to session_summaries" ON public.session_summaries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to treatment_plans" ON public.treatment_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to treatment_plan_exercises" ON public.treatment_plan_exercises FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_sessions_patient ON public.sessions(patient_id);
CREATE INDEX idx_treatment_plans_session ON public.treatment_plans(session_id);
CREATE INDEX idx_exercises_body_area ON public.exercises(body_area);
CREATE INDEX idx_exercises_goal ON public.exercises(goal);

-- Seed some initial exercises
INSERT INTO public.exercises (name, description, body_area, goal, difficulty, instructions) VALUES
('Shoulder Pendulum', 'Gentle pendulum swings to improve shoulder mobility', 'shoulder', 'mobility', 'easy', 'Lean forward, let arm hang, swing in small circles'),
('Wall Push-ups', 'Modified push-ups against a wall', 'shoulder', 'strength', 'easy', 'Stand arm''s length from wall, push body toward and away'),
('Quad Stretch', 'Standing quadriceps stretch', 'knee', 'flexibility', 'easy', 'Hold ankle behind you, keep knees together'),
('Hamstring Curl', 'Standing hamstring curl exercise', 'knee', 'strength', 'medium', 'Stand on one leg, curl other heel toward buttock'),
('Cat-Cow Stretch', 'Alternating spinal flexion and extension', 'back', 'mobility', 'easy', 'On hands and knees, arch and round your back'),
('Bird Dog', 'Core stability exercise', 'back', 'strength', 'medium', 'Extend opposite arm and leg while on hands and knees'),
('Hip Flexor Stretch', 'Kneeling hip flexor stretch', 'hip', 'flexibility', 'easy', 'Kneel on one knee, push hips forward'),
('Clamshell', 'Side-lying hip strengthening', 'hip', 'strength', 'easy', 'Lie on side, knees bent, open top knee like a clamshell'),
('Ankle Circles', 'Circular ankle movements', 'ankle', 'mobility', 'easy', 'Rotate ankle in circles, both directions'),
('Calf Raises', 'Standing calf strengthening', 'ankle', 'strength', 'easy', 'Rise up on toes, lower slowly'),
('Neck Rotation', 'Gentle neck rotation stretch', 'neck', 'mobility', 'easy', 'Slowly turn head side to side'),
('Chin Tucks', 'Postural neck exercise', 'neck', 'strength', 'easy', 'Pull chin back while keeping eyes level'),
('Wrist Flexor Stretch', 'Forearm and wrist stretch', 'wrist', 'flexibility', 'easy', 'Extend arm, pull fingers back gently'),
('Grip Strengthening', 'Hand grip exercises', 'wrist', 'strength', 'easy', 'Squeeze a stress ball or towel'),
('Piriformis Stretch', 'Figure-4 stretch for piriformis', 'hip', 'flexibility', 'medium', 'Cross ankle over opposite knee, lean forward'),
('Bridge', 'Glute and core strengthening', 'back', 'strength', 'easy', 'Lie on back, lift hips toward ceiling'),
('Scapular Squeeze', 'Upper back postural exercise', 'shoulder', 'strength', 'easy', 'Squeeze shoulder blades together'),
('Standing Marches', 'Hip flexion exercise', 'hip', 'strength', 'easy', 'March in place, lifting knees high'),
('Heel Slides', 'Knee range of motion exercise', 'knee', 'mobility', 'easy', 'Slide heel toward buttock while lying down'),
('Thoracic Extension', 'Upper back mobility exercise', 'back', 'mobility', 'medium', 'Use foam roller under upper back, extend over it');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON public.treatment_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();