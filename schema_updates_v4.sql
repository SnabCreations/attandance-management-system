
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Policies for students
DROP POLICY IF EXISTS "Students can view their own profile" ON public.students;
CREATE POLICY "Students can view their own profile" ON public.students
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND (users.roles @> '{"Admin"}' OR users.roles @> '{"Tutor"}' OR users.roles @> '{"Faculty"}')
    )
  );

DROP POLICY IF EXISTS "Students can update their own profile" ON public.students;
CREATE POLICY "Students can update their own profile" ON public.students
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Make sure Parent policy is retained (parents can view their kids)
DROP POLICY IF EXISTS "Parents can view their kids" ON public.students;
CREATE POLICY "Parents can view their kids" ON public.students
  FOR SELECT USING (auth.uid() = parent_id);

