'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAssignment(formData: FormData) {
  const supabase = await createClient()
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const subject_id = parseInt(formData.get('subject_id') as string)
  const due_date = formData.get('due_date') as string
  
  if (!title || !subject_id || !due_date) return
  
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
  
  // 2. Insert Assignment
  const { data: assignment, error: assignmentError } = await adminClient
    .from('assignments')
    .insert([{ 
      title, 
      description, 
      subject_id, 
      due_date,
      created_by: user.id
    }])
    .select()
    .single()
    
  if (assignmentError || !assignment) {
    console.error('Error creating assignment:', assignmentError)
    return
  }
  
  // 3. Fetch all students in that semester
  const { data: students } = await adminClient
    .from('students')
    .select('id')
    .eq('semester_id', mapping.semester_id)
    
  if (students && students.length > 0) {
    // 4. Batch insert into student_assignments so every student has a pending assignment
    const studentAssignments = students.map(student => ({
      assignment_id: assignment.id,
      student_id: student.id,
      status: 'Pending',
      marks: null
    }))
    
    await adminClient.from('student_assignments').insert(studentAssignments)
  }
  
  revalidatePath('/dashboard/faculty/assignments')
  revalidatePath('/dashboard')
}
