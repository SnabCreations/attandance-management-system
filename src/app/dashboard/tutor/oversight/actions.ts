'use server'

import { createClient } from '@/utils/supabase/server'

export async function fetchRecentLogs(semesterId: number) {
  const supabase = await createClient()

  // 1. Fetch students in this semester to get their IDs
  const { data: students } = await supabase
    .from('students')
    .select('id')
    .eq('semester_id', semesterId)

  if (!students || students.length === 0) return []
  
  const studentIds = students.map(s => s.id)

  // 2. Fetch the most recent 100 attendance logs for these students
  const { data: logs } = await supabase
    .from('attendance')
    .select(`
      id,
      date,
      status,
      hours,
      is_extra_hours,
      students(name),
      subjects(name),
      attendance_hours(
        time_slots(name, start_time, end_time)
      )
    `)
    .in('student_id', studentIds)
    .order('date', { ascending: false })
    .limit(100)

  return logs || []
}
