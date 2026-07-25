'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitAttendance(formData: FormData, students: any[]) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const subject_id = parseInt(formData.get('subject_id') as string)
  const date = formData.get('date') as string
  const hours = parseInt(formData.get('hours') as string)
  const is_extra = formData.get('is_extra') === 'on'
  
  // Build batch insert array
  const attendanceRecords = students.map((student) => {
    // If the checkbox is checked, the student is Absent
    const isAbsent = formData.get(`absent_${student.id}`) === 'on'
    
    return {
      student_id: student.id,
      subject_id,
      date,
      hours,
      is_extra_hours: is_extra,
      status: isAbsent ? 'Absent' : 'Present',
      marked_by: user.id
    }
  })
  
  const { error } = await supabase
    .from('attendance')
    .insert(attendanceRecords)
    
  if (error) {
    console.error('Error logging attendance:', error)
  }
  
  revalidatePath('/dashboard/faculty/attendance')
}
