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
  
  if (time_slots.length === 0) return // Ensure at least one time slot is selected
  
  // 1. Insert into faculty_teaching_logs (ON CONFLICT DO NOTHING using upsert)
  const teachingLogs = time_slots.map(slotId => ({
    faculty_id: user.id,
    subject_id,
    date,
    time_slot_id: parseInt(slotId)
  }))
  
  // Upsert into faculty logs
  const { error: logError } = await supabase
    .from('faculty_teaching_logs')
    .upsert(teachingLogs, { onConflict: 'faculty_id, subject_id, date, time_slot_id' })
    
  if (logError) {
    console.error('Error logging faculty teaching hours:', logError)
  }

  // Overwrite logic: First, find any existing attendance by this user for this subject and date
  const { data: userExistingAttendance } = await supabase
    .from('attendance')
    .select('id')
    .eq('marked_by', user.id)
    .eq('subject_id', subject_id)
    .eq('date', date)

  if (userExistingAttendance && userExistingAttendance.length > 0) {
    const attendanceIds = userExistingAttendance.map(a => a.id)
    // Delete the specific time slots they are re-submitting so we can cleanly replace them
    await supabase
      .from('attendance_hours')
      .delete()
      .in('attendance_id', attendanceIds)
      .in('time_slot_id', time_slots.map(id => parseInt(id)))
  }

  // 2. Check which time slots were ALREADY marked by ANY OTHER faculty to prevent double student attendance
  const { data: existingLogs } = await supabase
    .from('attendance_hours')
    .select(`
      time_slot_id,
      attendance!inner (subject_id, date, marked_by)
    `)
    .eq('attendance.subject_id', subject_id)
    .eq('attendance.date', date)
    .in('time_slot_id', time_slots.map(id => parseInt(id)))
    .neq('attendance.marked_by', user.id) // check if someone ELSE marked it

  // If a slot was marked by someone else, we shouldn't insert student attendance for it again
  const existingSlotIds = new Set(existingLogs?.map(l => l.time_slot_id) || [])
  const newSlotIds = time_slots.map(id => parseInt(id)).filter(id => !existingSlotIds.has(id))
  
  const hours = newSlotIds.length
  
  if (hours > 0) {
    // Build batch insert array ONLY for the new slots
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
    
    // Insert into attendance_hours mapping table for the new slots
    if (insertedRecords && insertedRecords.length > 0) {
      const hoursData: any[] = []
      
      insertedRecords.forEach((record) => {
        newSlotIds.forEach((slotId) => {
          hoursData.push({
            attendance_id: record.id,
            time_slot_id: slotId
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
  }
  
  revalidatePath('/dashboard/faculty/attendance')
}

export async function deleteAttendanceHour(subject_id: number, date: string, time_slot_id: number) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: callerProfile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()
    
  const isAdmin = callerProfile?.roles?.includes('Admin')

  // Find attendance records for this subject/date
  const query = supabase
    .from('attendance')
    .select('id, marked_by')
    .eq('subject_id', subject_id)
    .eq('date', date)
    
  if (!isAdmin) {
    query.eq('marked_by', user.id)
  }

  const { data: existingAttendance } = await query

  if (existingAttendance && existingAttendance.length > 0) {
    const attendanceIds = existingAttendance.map(a => a.id)
    
    // Delete the hour mapping
    await supabase
      .from('attendance_hours')
      .delete()
      .in('attendance_id', attendanceIds)
      .eq('time_slot_id', time_slot_id)
      
    // Delete from faculty_teaching_logs for consistency
    await supabase
      .from('faculty_teaching_logs')
      .delete()
      .eq('subject_id', subject_id)
      .eq('date', date)
      .eq('time_slot_id', time_slot_id)
      .eq('faculty_id', existingAttendance[0].marked_by)
  }

  revalidatePath('/dashboard/faculty/attendance')
  return { success: true }
}
