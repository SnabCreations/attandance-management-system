'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAvatarUrl(url: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('users')
    .update({ avatar_url: url })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating avatar:', error)
    throw new Error('Failed to update avatar')
  }

  revalidatePath('/dashboard', 'layout')
}
