'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveNote(formData: FormData) {
  const supabase = await createClient()
  
  const content = formData.get('content') as string
  const noteId = formData.get('id') as string
  
  if (!content) return
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  if (noteId) {
    // Update existing note
    const { error } = await supabase
      .from('user_notes')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', noteId)
      .eq('user_id', user.id)
      
    if (error) console.error('Error updating note:', error)
  } else {
    // Create new note
    const { error } = await supabase
      .from('user_notes')
      .insert([{ 
        content,
        user_id: user.id
      }])
      
    if (error) console.error('Error creating note:', error)
  }
  
  revalidatePath('/dashboard/notes')
}

export async function deleteNote(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  if (!id) return
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  const { error } = await supabase
    .from('user_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    
  if (error) console.error('Error deleting note:', error)
  
  revalidatePath('/dashboard/notes')
}
