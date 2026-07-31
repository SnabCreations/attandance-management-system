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

export async function bulkAddSubjects(data: any[], semester_id: number) {
  const supabase = await createClient()
  
  if (!semester_id || !data || data.length === 0) return { error: 'Invalid data' }
  
  const inserts = data.map(row => ({
    name: row['Name'] || row['name'],
    code: row['Code'] || row['code'] || '',
    semester_id
  })).filter(s => s.name)
  
  const { error } = await supabase.from('subjects').insert(inserts)
  
  if (error) {
    console.error('Error in bulkAddSubjects:', error)
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/subjects')
  return { count: inserts.length }
}

export async function editSubject(id: number, name: string, code: string) {
  const supabase = await createClient()
  if (!id || !name) return
  
  const { error } = await supabase.from('subjects').update({ name, code }).eq('id', id)
  if (error) console.error('Error updating subject:', error)
  
  revalidatePath('/dashboard/subjects')
}

export async function deleteSubject(id: number) {
  const supabase = await createClient()
  if (!id) return
  
  // Might fail if there are dependencies (e.g. timetables, question papers)
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  if (error) console.error('Error deleting subject:', error)
  
  revalidatePath('/dashboard/subjects')
}
