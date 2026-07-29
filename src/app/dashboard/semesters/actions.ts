'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addSemester(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const department_id = formData.get('department_id') as string
  const tutor_id = formData.get('tutor_id') as string
  
  if (!name || !department_id) return
  
  const payload: any = { name, department_id: parseInt(department_id) }
  if (tutor_id) payload.tutor_id = tutor_id

  const { error } = await supabase
    .from('semesters')
    .insert([payload])
    
  if (error) {
    console.error('Error inserting semester:', error)
  }
  
  revalidatePath('/dashboard/semesters')
}

export async function bulkAddSemesters(data: any[], department_id: number) {
  const supabase = await createClient()
  
  if (!department_id || !data || data.length === 0) return { error: 'Invalid data' }
  
  const inserts = data.map(row => ({
    name: row['Name'] || row['name'] || '',
    department_id
  })).filter(s => s.name)
  
  const { error } = await supabase.from('semesters').insert(inserts)
  
  if (error) {
    console.error('Error in bulkAddSemesters:', error)
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/semesters')
  return { count: inserts.length }
}

export async function promoteSemester(formData: FormData) {
  const supabase = await createClient()
  
  const from_semester_id = formData.get('from_semester_id') as string
  const to_semester_id = formData.get('to_semester_id') as string
  
  if (!from_semester_id || !to_semester_id) return
  
  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: userProfile } = await supabase.from('users').select('roles').eq('id', user.id).single()
  if (!userProfile?.roles?.includes('Admin')) return
  
  const targetId = to_semester_id === 'alumni' ? null : parseInt(to_semester_id)
  
  const { error } = await supabase
    .from('students')
    .update({ semester_id: targetId })
    .eq('semester_id', parseInt(from_semester_id))
    
  if (error) {
    console.error('Error promoting batch:', error)
  }
  
  revalidatePath('/dashboard/semesters')
  // We should also revalidate tutor registry since students moved
  revalidatePath('/dashboard/tutor/students')
}
