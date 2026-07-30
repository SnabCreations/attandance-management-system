'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTest(formData: FormData) {
  const supabase = await createClient()
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const subject_id = parseInt(formData.get('subject_id') as string)
  const test_date = formData.get('test_date') as string
  const max_marks = parseInt(formData.get('max_marks') as string)
  
  if (!title || !subject_id || !test_date || !max_marks) return
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  const { data: userProfile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()
    
  if (!userProfile?.roles?.includes('Admin') && !userProfile?.roles?.includes('Faculty')) {
    return
  }

  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminClient = createAdminClient()

  // 1. Fetch the semester_id for this subject from faculty_subjects FIRST
  const { data: mapping } = await adminClient
    .from('faculty_subjects')
    .select('semester_id')
    .eq('faculty_id', user.id)
    .eq('subject_id', subject_id)
    .single()
    
  if (!mapping) return
  
  // 2. Insert Test
  const { data: test, error: testError } = await adminClient
    .from('tests')
    .insert([{ 
      title, 
      description, 
      subject_id,
      semester_id: mapping.semester_id,
      test_date,
      max_marks,
      created_by: user.id
    }])
    .select()
    .single()
    
  if (testError || !test) {
    console.error('Error creating test:', testError)
    return
  }
  
  // 3. Fetch all students in that semester
  const { data: students } = await adminClient
    .from('students')
    .select('id')
    .eq('semester_id', mapping.semester_id)
    
  if (students && students.length > 0) {
    // 4. Batch insert into student_tests so every student has a pending test record
    const studentTests = students.map(student => ({
      test_id: test.id,
      student_id: student.id,
      status: 'Pending',
      marks_obtained: null
    }))
    
    await adminClient.from('student_tests').insert(studentTests)
  }
  
  revalidatePath('/dashboard/faculty/tests')
  revalidatePath('/dashboard')
}
