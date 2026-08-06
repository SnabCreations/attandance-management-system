'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addDepartment(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const code = formData.get('code') as string
  
  if (!name || !code) return
  
  const { error } = await supabase
    .from('departments')
    .insert([{ name, code: code.trim().toLowerCase() }])
    
  if (error) {
    console.error('Error inserting department:', error)
    // In a real app we'd return the error to the UI
  }
  
  revalidatePath('/dashboard/departments')
}
