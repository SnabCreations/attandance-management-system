-- Question Papers Table
CREATE TABLE IF NOT EXISTS public.question_papers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  drive_link text NOT NULL,
  subject_id integer REFERENCES public.subjects(id) ON DELETE CASCADE,
  semester_id integer REFERENCES public.semesters(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.question_papers ENABLE ROW LEVEL SECURITY;

-- Everyone can read question papers
DROP POLICY IF EXISTS "Enable read access for all users" ON public.question_papers;
CREATE POLICY "Enable read access for all users" ON public.question_papers
  FOR SELECT USING (true);

-- Only Faculty and Admin can insert
DROP POLICY IF EXISTS "Enable insert for faculty and admin" ON public.question_papers;
CREATE POLICY "Enable insert for faculty and admin" ON public.question_papers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.roles @> '{"Faculty"}' OR users.roles @> '{"Admin"}')
    )
  );

-- Only Admin or the uploader can delete
DROP POLICY IF EXISTS "Enable delete for admin or uploader" ON public.question_papers;
CREATE POLICY "Enable delete for admin or uploader" ON public.question_papers
  FOR DELETE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.roles @> '{"Admin"}'
    )
  );

-- Add code column to subjects if it doesn't exist
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS code TEXT;

-- Semester-specific hours
ALTER TABLE public.time_slots ADD COLUMN IF NOT EXISTS semester_id INTEGER REFERENCES public.semesters(id) ON DELETE CASCADE;

-- Faculty Teaching Logs to prevent student double hours but allow multiple faculty tracking
CREATE TABLE IF NOT EXISTS public.faculty_teaching_logs (
  id SERIAL PRIMARY KEY,
  faculty_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES public.subjects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot_id INTEGER REFERENCES public.time_slots(id) ON DELETE CASCADE,
  UNIQUE(faculty_id, subject_id, date, time_slot_id)
);

ALTER TABLE public.faculty_teaching_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for admins and faculty" ON public.faculty_teaching_logs;
CREATE POLICY "Enable all for admins and faculty" ON public.faculty_teaching_logs FOR ALL USING (true);
