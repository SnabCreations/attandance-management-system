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

export async function saveAllTimetableSlots(semester_id: number, slotsToSave: any[]) {
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

  // 1. Delete all existing slots for this semester to clean slate
  const { error: deleteError } = await supabase
    .from('timetables')
    .delete()
    .eq('semester_id', semester_id)

  if (deleteError) {
    console.error(deleteError)
    return { error: 'Failed to reset timetable' }
  }

  // 2. Insert the non-empty slots
  const validSlots = slotsToSave.filter(s => s.faculty_id && s.subject_id)
  
  if (validSlots.length > 0) {
    const { error: insertError } = await supabase
      .from('timetables')
      .insert(validSlots.map(s => ({
        semester_id,
        day_of_week: s.day_of_week,
        hour_slot: s.hour_slot,
        faculty_id: s.faculty_id,
        subject_id: parseInt(s.subject_id)
      })))
      
    if (insertError) {
      console.error(insertError)
      return { error: 'Failed to save new timetable' }
    }
  }

  revalidatePath('/dashboard/timetables')
  return { success: true }
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

export async function checkTimetableConflicts(semester_id: number, entries: any[]) {
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

  // Fetch existing slots for this semester
  const { data: existingSlots } = await supabase
    .from('timetables')
    .select(`
      day_of_week, 
      hour_slot, 
      faculty_id,
      users (email, raw_user_meta_data),
      subjects (code, name)
    `)
    .eq('semester_id', semester_id)

  if (!existingSlots || existingSlots.length === 0) {
    return { conflicts: [] }
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const conflicts: string[] = []

  for (const entry of entries) {
    const conflict = existingSlots.find(s => s.day_of_week === entry.day_of_week && s.hour_slot === entry.hour_slot)
    
    if (conflict) {
      const dayName = days[entry.day_of_week - 1] || 'Unknown Day'
      const facultyName = (conflict.users as any)?.raw_user_meta_data?.name || (conflict.users as any)?.email || 'Unknown Faculty'
      const subjectName = (conflict.subjects as any)?.name || (conflict.subjects as any)?.code || 'Unknown Subject'
      
      conflicts.push(`${dayName} Hour ${entry.hour_slot} is currently assigned to ${facultyName} (${subjectName})`)
    }
  }

  return { conflicts }
}
