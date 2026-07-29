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
