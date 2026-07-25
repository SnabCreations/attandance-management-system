'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addSubject(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const semester_id = formData.get('semester_id') as string
  
  if (!name || !semester_id) return
  
  const { error } = await supabase
    .from('subjects')
    .insert([{ name, semester_id: parseInt(semester_id) }])
    
  if (error) {
    console.error('Error inserting subject:', error)
  }
  
  revalidatePath('/dashboard/subjects')
}
