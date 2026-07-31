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
CREATE POLICY "Enable read access for all users" ON public.question_papers
  FOR SELECT USING (true);

-- Only Faculty and Admin can insert
CREATE POLICY "Enable insert for faculty and admin" ON public.question_papers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.roles @> '{"Faculty"}' OR users.roles @> '{"Admin"}')
    )
  );

-- Only Admin or the uploader can delete
CREATE POLICY "Enable delete for admin or uploader" ON public.question_papers
  FOR DELETE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.roles @> '{"Admin"}'
    )
  );
