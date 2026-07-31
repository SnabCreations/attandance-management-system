'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateTimetableSlot(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  const { data: callerProfile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()
    
  if (!callerProfile?.roles?.includes('Admin') && !callerProfile?.roles?.includes('Tutor')) {
    return
  }

  const semester_id = parseInt(formData.get('semester_id') as string)
  const day_of_week = parseInt(formData.get('day_of_week') as string)
  const hour_slot = parseInt(formData.get('hour_slot') as string)
  const faculty_id = formData.get('faculty_id') as string
  const subject_id = parseInt(formData.get('subject_id') as string)
  
  // First, check if there's an existing slot
  const { data: existingSlot } = await supabase
    .from('timetables')
    .select('id')
    .eq('semester_id', semester_id)
    .eq('day_of_week', day_of_week)
    .eq('hour_slot', hour_slot)
    .single()

  if (faculty_id && subject_id) {
    // Upsert the slot
    if (existingSlot) {
      const { error } = await supabase
        .from('timetables')
        .update({ faculty_id, subject_id })
        .eq('id', existingSlot.id)
        
      if (error) {
        console.error(error)
        return
      }
    } else {
      const { error } = await supabase
        .from('timetables')
        .insert([{ semester_id, day_of_week, hour_slot, faculty_id, subject_id }])
        
      if (error) {
        console.error(error)
        return
      }
    }
  } else {
    // Delete the slot if faculty/subject is unselected
    if (existingSlot) {
      await supabase.from('timetables').delete().eq('id', existingSlot.id)
    }
  }

  revalidatePath('/dashboard/timetables')
}

export async function bulkUploadTimetable(semester_id: number, entries: any[]) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  
  const { data: callerProfile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()
    
  if (!callerProfile?.roles?.includes('Admin') && !callerProfile?.roles?.includes('Tutor')) {
    return { error: 'Unauthorized' }
  }

  // 1. Fetch relevant subjects for mapping
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, code')
    .eq('semester_id', semester_id)

  const subjectMap = new Map()
  subjects?.forEach(s => {
    if (s.code) subjectMap.set(s.code.toLowerCase(), s.id)
  })

  // 2. Fetch all faculties for mapping
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminClient = createAdminClient()
  const { data: faculties } = await adminClient
    .from('users')
    .select('id, email')
    .contains('roles', ['Faculty'])

  const facultyMap = new Map()
  faculties?.forEach(f => {
    if (f.email) facultyMap.set(f.email.toLowerCase(), f.id)
  })

  // 3. Prepare inserts/upserts
  let insertedCount = 0
  const errors: string[] = []

  for (const entry of entries) {
    const subject_id = subjectMap.get(entry.subject_code.toLowerCase())
    const faculty_id = facultyMap.get(entry.faculty_email.toLowerCase())

    if (!subject_id) {
      errors.push(`Subject code ${entry.subject_code} not found in this semester.`)
      continue
    }

    if (!faculty_id) {
      errors.push(`Faculty email ${entry.faculty_email} not found.`)
      continue
    }

    // Upsert logic
    const { data: existingSlot } = await supabase
      .from('timetables')
      .select('id')
      .eq('semester_id', semester_id)
      .eq('day_of_week', entry.day_of_week)
      .eq('hour_slot', entry.hour_slot)
      .single()

    if (existingSlot) {
      await supabase
        .from('timetables')
        .update({ faculty_id, subject_id })
        .eq('id', existingSlot.id)
    } else {
      await supabase
        .from('timetables')
        .insert([{ 
          semester_id, 
          day_of_week: entry.day_of_week, 
          hour_slot: entry.hour_slot, 
          faculty_id, 
          subject_id 
        }])
    }
    insertedCount++
  }

  revalidatePath('/dashboard/timetables')
  
  if (errors.length > 0 && insertedCount === 0) {
    return { error: errors.join(' ') }
  } else if (errors.length > 0) {
    return { count: insertedCount, error: `Uploaded ${insertedCount} slots, but had some issues: ${errors.slice(0, 3).join(' ')}...` }
  }

  return { count: insertedCount }
}
