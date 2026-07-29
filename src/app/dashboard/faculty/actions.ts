'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function assignFaculty(formData: FormData) {
  const supabase = await createClient()
  
  const faculty_id = formData.get('faculty_id') as string
  const subjectCombo = formData.get('subject_id') as string // Contains "subjectId_semesterId"
  
  if (!faculty_id || !subjectCombo) return
  
  // Verify caller is an Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  const { data: callerProfile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()
    
  if (!callerProfile?.roles?.includes('Admin')) return

  const [subject_id, semester_id] = subjectCombo.split('_')
  
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminClient = createAdminClient()
  
  const { error } = await adminClient
    .from('faculty_subjects')
    .insert([{ 
      faculty_id, 
      subject_id: parseInt(subject_id),
      semester_id: parseInt(semester_id)
    }])
    
  if (error) {
    console.error('Error assigning faculty:', error)
  }
  
  revalidatePath('/dashboard/faculty')
}

export async function deleteAssignment(assignment_id: string) {
  const supabase = await createClient()
  
  // Verify caller is an Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  const { data: callerProfile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()
    
  if (!callerProfile?.roles?.includes('Admin')) return

  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminClient = createAdminClient()
  
  await adminClient.from('faculty_subjects').delete().eq('id', assignment_id)
  
  revalidatePath('/dashboard/faculty')
}
