'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function bulkUploadQuestionPapers(data: any[]) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Map the data to the correct table structure
  const papersToInsert = data.map(item => ({
    title: item.title,
    drive_link: item.drive_link,
    subject_id: parseInt(item.subject_id),
    semester_id: parseInt(item.semester_id),
    uploaded_by: user.id
  }))

  const { error } = await supabase
    .from('question_papers')
    .insert(papersToInsert)

  if (error) {
    console.error('Error inserting question papers:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/question-papers')
  return { success: true }
}
