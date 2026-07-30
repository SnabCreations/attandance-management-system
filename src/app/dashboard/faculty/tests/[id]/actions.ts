'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveGrades(formData: FormData, submissions: any[], testId: string) {
  const supabase = await createClient()
  
  // Create an array of updates
  const updates = submissions.map(sub => {
    const status = formData.get(`status_${sub.id}`) as string
    const marksRaw = formData.get(`marks_${sub.id}`) as string
    const marks = marksRaw ? parseInt(marksRaw) : null

    return {
      id: sub.id,
      test_id: parseInt(testId),
      student_id: sub.students.id,
      status,
      marks_obtained: marks
    }
  })
  
  // Supabase 'upsert' can act as a bulk update if we provide the primary key 'id'
  const { error } = await supabase
    .from('student_tests')
    .upsert(updates)
    
  if (error) {
    console.error('Error saving grades:', error)
  }
  
  revalidatePath(`/dashboard/faculty/tests/${testId}`)
}
