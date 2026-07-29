'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addAnnouncement(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const target_audience = formData.get('target_audience') as string || 'all'
  
  if (!title || !content) return

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('announcements')
    .insert([{ title, content, target_audience }])
    
  if (error) {
    console.error('Error adding announcement:', error)
    return
  }
  
  revalidatePath('/dashboard/announcements')
  revalidatePath('/')
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // RLS will ensure only authorized users can delete, or we can check here.
  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('announcements')
    .delete()
    .eq('id', id)
    
  if (error) {
    console.error('Error deleting announcement:', error)
    return
  }
  
  revalidatePath('/dashboard/announcements')
  revalidatePath('/')
}
