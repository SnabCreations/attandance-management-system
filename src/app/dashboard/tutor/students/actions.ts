'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addStudent(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const roll_no = formData.get('roll_no') as string
  const semesterCombo = formData.get('semester_id') as string // Contains "semesterId_departmentId"
  const parent_id = formData.get('parent_id') as string
  
  if (!name || !roll_no || !semesterCombo) return
  
  const [semester_id, department_id] = semesterCombo.split('_')
  
  const insertData: any = {
    name,
    roll_no,
    semester_id: parseInt(semester_id),
    department_id: parseInt(department_id)
  }

  if (parent_id) {
    insertData.parent_id = parent_id
  }
  
  const { error } = await supabase
    .from('students')
    .insert([insertData])
    
  if (error) {
    console.error('Error adding student:', error)
  }
  
  revalidatePath('/dashboard/tutor/students')
}
