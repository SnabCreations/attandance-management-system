'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addSemester(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const department_id = formData.get('department_id') as string
  const tutor_ids = formData.getAll('tutor_id') as string[]
  
  if (!name || !department_id) return
  
  const payload: any = { name, department_id: parseInt(department_id) }

  const { data: semesterData, error } = await supabase
    .from('semesters')
    .insert([payload])
    .select()
    .single()
    
  if (error) {
    console.error('Error inserting semester:', error)
  } else if (semesterData && tutor_ids.length > 0) {
    const tutorInserts = tutor_ids.map(id => ({
      semester_id: semesterData.id,
      tutor_id: id
    }))
    await supabase.from('semester_tutors').insert(tutorInserts)
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
  
  const from_semester_id = parseInt(formData.get('from_semester_id') as string)
  const new_semester_name = formData.get('new_semester_name') as string
  
  if (!from_semester_id || !new_semester_name) return
  
  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: userProfile } = await supabase.from('users').select('roles').eq('id', user.id).single()
  if (!userProfile?.roles?.includes('Admin')) return
  
  // 1. Fetch original semester
  const { data: oldSem } = await supabase.from('semesters').select('*').eq('id', from_semester_id).single()
  if (!oldSem) return

  // 2. Create new semester
  const { data: newSem, error: createError } = await supabase
    .from('semesters')
    .insert([{ name: new_semester_name, department_id: oldSem.department_id }])
    .select()
    .single()
    
  if (createError || !newSem) {
    console.error('Error creating new semester:', createError)
    return
  }

  // 3. Copy tutors
  const { data: oldTutors } = await supabase.from('semester_tutors').select('tutor_id').eq('semester_id', from_semester_id)
  if (oldTutors && oldTutors.length > 0) {
    const newTutors = oldTutors.map(t => ({ semester_id: newSem.id, tutor_id: t.tutor_id }))
    await supabase.from('semester_tutors').insert(newTutors)
  }
  
  // 4. Move students
  const { error } = await supabase
    .from('students')
    .update({ semester_id: newSem.id })
    .eq('semester_id', from_semester_id)
    
  if (error) {
    console.error('Error promoting batch:', error)
  }
  
  revalidatePath('/dashboard/semesters')
  // We should also revalidate tutor registry since students moved
  revalidatePath('/dashboard/tutor/students')
}
