'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveGrades(formData: FormData, submissions: any[], assignmentId: string) {
  const supabase = await createClient()
  
  // Create an array of updates
  const updates = submissions.map(sub => {
    const status = formData.get(`status_${sub.id}`) as string
    const marksRaw = formData.get(`marks_${sub.id}`) as string
    const marks = marksRaw ? parseInt(marksRaw) : null

    return {
      id: sub.id,
      assignment_id: parseInt(assignmentId),
      student_id: sub.students.id, // required if table doesn't allow partial updates without it, but we can just update specific rows
      status,
      marks,
      submitted_at: status === 'Submitted' ? new Date().toISOString() : null
    }
  })
  
  // Supabase 'upsert' can act as a bulk update if we provide the primary key 'id'
  const { error } = await supabase
    .from('student_assignments')
    .upsert(updates)
    
  if (error) {
    console.error('Error saving grades:', error)
  }
  
  revalidatePath(`/dashboard/faculty/assignments/${assignmentId}`)
}
