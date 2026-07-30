'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMaterial(formData: FormData) {
  const supabase = await createClient()
  
  const title = formData.get('title') as string
  const content = formData.get('description') as string
  const subject_id = parseInt(formData.get('subject_id') as string)
  const file_url = formData.get('url') as string
  
  if (!title || !subject_id) return
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminClient = createAdminClient()

  // Fetch the semester_id for this subject from faculty_subjects FIRST
  const { data: mapping } = await adminClient
    .from('faculty_subjects')
    .select('semester_id')
    .eq('faculty_id', user.id)
    .eq('subject_id', subject_id)
    .single()
    
  if (!mapping) return
  
  // Insert Material
  const { error } = await adminClient
    .from('study_materials')
    .insert([{ 
      title, 
      content, 
      subject_id,
      semester_id: mapping.semester_id,
      file_url,
      created_by: user.id
    }])
    
  if (error) {
    console.error('Error creating material:', error)
  }
  
  revalidatePath('/dashboard/faculty/materials')
  revalidatePath('/dashboard/student')
}

export async function deleteMaterial(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) return
  
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminClient = createAdminClient()
  
  await adminClient.from('study_materials').delete().eq('id', id)
  
  revalidatePath('/dashboard/faculty/materials')
  revalidatePath('/dashboard/student')
}
