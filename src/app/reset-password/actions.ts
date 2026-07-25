'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters long' }
  }

  if (password !== confirm) {
    return { error: 'Passwords do not match' }
  }

  // 1. Update Auth Password
  const { error: updateError } = await supabase.auth.updateUser({
    password: password
  })

  if (updateError) {
    console.error('Auth update error:', updateError)
    return { error: updateError.message }
  }

  const supabaseAdmin = createAdminClient()

  // 2. Mark force_password_reset as false in our users table
  const { error: dbError } = await supabaseAdmin
    .from('users')
    .update({ force_password_reset: false })
    .eq('id', user.id)

  if (dbError) {
    console.error('DB update error:', dbError)
    return { error: 'Failed to update user profile' }
  }

  redirect('/dashboard')
}
