'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

function generateRandomPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function createUser(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Verify caller is an Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  
  const { data: callerProfile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()
    
  if (!callerProfile?.roles?.includes('Admin')) return { error: 'Unauthorized. Admins only.' }

  const email = formData.get('email') as string
  const roles = formData.getAll('roles') as string[]
  
  if (!email || roles.length === 0) return { error: 'Missing fields' }

  // 2. Generate Password
  const password = generateRandomPassword()

  // 3. Create user in Supabase Auth
  const adminClient = createAdminClient()
  
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (authError) {
    console.error('Error creating auth user:', authError)
    return { error: authError.message }
  }

  // 4. Insert into our custom users table
  const { error: dbError } = await adminClient
    .from('users')
    .insert([{ 
      id: authData.user.id,
      email,
      roles,
      force_password_reset: true
    }])

  if (dbError) {
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return { error: 'Failed to create user profile' }
  }

  revalidatePath('/dashboard/users')
  
  return { password, email }
}

export async function deleteUser(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Verify caller is an Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  const { data: callerProfile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()
    
  if (!callerProfile?.roles?.includes('Admin')) return

  const target_user_id = formData.get('user_id') as string
  if (!target_user_id) return
  
  // Prevent self-deletion
  if (target_user_id === user.id) return

  // 2. Delete user via Admin Client
  // Deleting from auth.users will cascade delete the row in public.users 
  // because of the REFERENCES ... ON DELETE CASCADE (if configured, or we can just delete from auth and let Supabase handle it. Actually our schema doesn't have ON DELETE CASCADE for users table to auth.users, it has REFERENCES. We should delete from auth.users, and it might fail if there's no cascade. Wait, our schema: id UUID REFERENCES auth.users(id) PRIMARY KEY. It doesn't have ON DELETE CASCADE. Let's delete from public.users first, then auth.users.)
  const adminClient = createAdminClient()
  
  await adminClient.from('users').delete().eq('id', target_user_id)
  await adminClient.auth.admin.deleteUser(target_user_id)

  revalidatePath('/dashboard/users')
}

export async function updateUserRoles(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Verify caller is an Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  
  const { data: callerProfile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()
    
  if (!callerProfile?.roles?.includes('Admin')) return { error: 'Unauthorized. Admins only.' }

  const target_user_id = formData.get('user_id') as string
  const roles = formData.getAll('roles') as string[]
  
  if (!target_user_id || roles.length === 0) {
    return { error: 'You must select at least one role.' }
  }
  
  // Use admin client
  const adminClient = createAdminClient()
  
  const { error } = await adminClient
    .from('users')
    .update({ roles })
    .eq('id', target_user_id)
    
  if (error) {
    console.error('Error updating user roles:', error)
    return { error: 'Failed to update user roles' }
  }
  
  revalidatePath('/dashboard/users')
  return { success: true }
}
