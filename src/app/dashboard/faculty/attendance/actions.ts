'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitAttendance(formData: FormData, students: any[]) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const subject_id = parseInt(formData.get('subject_id') as string)
  const date = formData.get('date') as string
  const time_slots = formData.getAll('time_slots') as string[]
  const is_extra = formData.get('is_extra') === 'on'
  
  const hours = time_slots.length
  if (hours === 0) return // Ensure at least one time slot is selected
  
  // Build batch insert array
  const attendanceRecords = students.map((student) => {
    const isPresent = formData.get(`present_${student.id}`) === 'on'
    
    return {
      student_id: student.id,
      subject_id,
      date,
      hours,
      is_extra_hours: is_extra,
      status: isPresent ? 'Present' : 'Absent',
      marked_by: user.id
    }
  })
  
  const { data: insertedRecords, error } = await supabase
    .from('attendance')
    .insert(attendanceRecords)
    .select('id')
    
  if (error) {
    console.error('Error logging attendance:', error)
    return
  }
  
  // Insert into attendance_hours mapping table
  if (insertedRecords && insertedRecords.length > 0) {
    const hoursData: any[] = []
    
    insertedRecords.forEach((record) => {
      time_slots.forEach((slotId) => {
        hoursData.push({
          attendance_id: record.id,
          time_slot_id: parseInt(slotId)
        })
      })
    })
    
    const { error: hoursError } = await supabase
      .from('attendance_hours')
      .insert(hoursData)
      
    if (hoursError) {
      console.error('Error logging attendance hours:', hoursError)
    }
  }
  
  revalidatePath('/dashboard/faculty/attendance')
}
