'use server'

import { createClient } from '@/utils/supabase/server'

export async function generateSemesterReport(semesterId: number) {
  const supabase = await createClient()

  // 1. Fetch students in this semester
  const { data: students } = await supabase
    .from('students')
    .select('id, name, roll_no')
    .eq('semester_id', semesterId)

  if (!students) return []

  const sortedStudents = students.sort((a: any, b: any) => 
    String(a.roll_no).localeCompare(String(b.roll_no), undefined, { numeric: true, sensitivity: 'base' })
  )

  // 2. We need to map over students and calculate their metrics
  // In a massive production app, we would write a PostgreSQL Stored Procedure for this,
  // but mapping in JS is perfectly fine for this scale.
  const reportData = await Promise.all(sortedStudents.map(async (student) => {
    
    // Attendance
    const { data: attendance } = await supabase
      .from('attendance')
      .select('status')
      .eq('student_id', student.id)
      
    const totalLogs = attendance?.length || 0
    const presentLogs = attendance?.filter(a => a.status === 'Present').length || 0
    const attendancePercentage = totalLogs > 0 ? Math.round((presentLogs / totalLogs) * 100) : 100

    // Assignments
    const { data: assignments } = await supabase
      .from('student_assignments')
      .select('status, marks')
      .eq('student_id', student.id)

    const totalAssignments = assignments?.length || 0
    const missingAssignments = assignments?.filter(a => a.status === 'Pending' || a.status === 'Late').length || 0
    
    const gradedAssignments = assignments?.filter(a => a.marks !== null) || []
    const totalMarks = gradedAssignments.reduce((sum, a) => sum + (a.marks || 0), 0)
    const avgMarks = gradedAssignments.length > 0 ? Math.round(totalMarks / gradedAssignments.length) : 0

    return {
      ...student,
      attendancePercentage,
      missingAssignments,
      avgMarks
    }
  }))

  return reportData
}
