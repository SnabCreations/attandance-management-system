'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

async function generateUniqueUsername(adminClient: any, name: string, deptCode: string) {
  // Convert "Pranav P" to "pranav.p"
  const formattedName = name.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '')
  const year = new Date().getFullYear().toString().slice(-2)
  const baseUsername = `${formattedName}@${deptCode.toLowerCase()}${year}`
  
  let currentUsername = baseUsername
  let counter = 1
  
  while (true) {
    const { data: existing } = await adminClient
      .from('students')
      .select('id')
      .eq('username', currentUsername)
      .single()
      
    if (!existing) {
      return currentUsername
    }
    
    currentUsername = `${formattedName}${counter.toString().padStart(2, '0')}@${deptCode.toLowerCase()}${year}`
    counter++
  }
}

export async function addStudentAndParent(formData: FormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  const student_name = formData.get('student_name') as string
  const roll_no = formData.get('roll_no') as string
  const student_username = formData.get('student_username') as string
  const semesterCombo = formData.get('semester_id') as string // Contains "semesterId_departmentId"
  
  const parent_email = formData.get('parent_email') as string
  
  if (!student_name || !roll_no || !semesterCombo) return { error: 'Missing student details' }
  
  const [semester_id_str, department_id_str] = semesterCombo.split('_')
  const semester_id = parseInt(semester_id_str)
  const department_id = parseInt(department_id_str)

  const { data: dept } = await adminClient.from('departments').select('code').eq('id', department_id).single()
  const deptCode = dept?.code || 'dept'
  
  let parent_id = null

  if (parent_email) {
    // Check if user already exists in custom table
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id, roles')
      .eq('email', parent_email)
      .single()

    if (existingUser) {
      parent_id = existingUser.id
      // Ensure they have the Parent role
      if (!existingUser.roles?.includes('Parent')) {
        const newRoles = [...(existingUser.roles || []), 'Parent']
        await adminClient.from('users').update({ roles: newRoles }).eq('id', parent_id)
      }
    } else {
      // Create new user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: parent_email,
        password: 'ams@carmel123',
        email_confirm: true
      })

      if (authError) {
        console.error('Error creating parent auth:', authError)
        return { error: 'Failed to create parent account: ' + authError.message }
      }

      if (authData.user) {
        parent_id = authData.user.id
        
        // Insert into custom users table
        const { error: dbError } = await adminClient
          .from('users')
          .insert([{ 
            id: parent_id,
            email: parent_email,
            roles: ['Parent'],
            force_password_reset: true // Force them to change Meams@123
          }])

        if (dbError) {
           await adminClient.auth.admin.deleteUser(parent_id)
           return { error: 'Failed to create parent profile' }
        }
      }
    }
  }

  // Now create the student
  const insertData: any = {
    name: student_name,
    roll_no,
    semester_id,
    department_id
  }

  if (parent_id) {
    insertData.parent_id = parent_id
  }

  // Generate Username & Create Auth User
  const username = student_username && student_username.trim() !== '' 
    ? student_username.trim().toLowerCase().replace(/[^a-z0-9@_.-]/g, '')
    : await generateUniqueUsername(adminClient, student_name, deptCode)
  const email = `${username}.carmel.in`
  let user_id = null

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: email,
    password: 'ams@carmel123',
    email_confirm: true
  })

  if (authData?.user) {
    user_id = authData.user.id
    await adminClient.from('users').insert([{
      id: user_id,
      email: email,
      roles: ['Student'],
      force_password_reset: true
    }])
  }

  insertData.user_id = user_id
  insertData.username = username

  const { error } = await adminClient
    .from('students')
    .insert([insertData])
    
  if (error) {
    console.error('Error adding student:', error)
    return { error: 'Failed to add student. Roll number might already exist.' }
  }
  
  revalidatePath('/dashboard/tutor/students')
  return { success: true }
}

export async function bulkUploadStudents(data: any[], semester_id: number, department_id: number) {
  const adminClient = createAdminClient()
  
  let successCount = 0
  let errorCount = 0

  const { data: dept } = await adminClient.from('departments').select('code').eq('id', department_id).single()
  const deptCode = dept?.code || 'dept'

  for (const row of data) {
    // Row format expected: { "Student Name": "...", "Roll No": "...", "Parent Email": "...", "Student ID": "..." }
    const student_name = row['Student Name'] || row['student_name'] || row['name']
    const roll_no = row['Roll No'] || row['roll_no']
    const parent_email = row['Parent Email'] || row['parent_email']
    const custom_username = row['Student ID'] || row['student_id'] || row['Username'] || row['username']

    if (!student_name || !roll_no) {
      errorCount++
      continue
    }

    let parent_id = null

    if (parent_email) {
      const { data: existingUser } = await adminClient
        .from('users')
        .select('id, roles')
        .eq('email', parent_email)
        .single()

      if (existingUser) {
        parent_id = existingUser.id
        if (!existingUser.roles?.includes('Parent')) {
          const newRoles = [...(existingUser.roles || []), 'Parent']
          await adminClient.from('users').update({ roles: newRoles }).eq('id', parent_id)
        }
      } else {
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: parent_email,
          password: 'ams@carmel123',
          email_confirm: true
        })

        if (!authError && authData.user) {
          parent_id = authData.user.id
          await adminClient
            .from('users')
            .insert([{ 
              id: parent_id,
              email: parent_email,
              roles: ['Parent'],
              force_password_reset: true
            }])
        }
      }
    }

    const username = custom_username && String(custom_username).trim() !== ''
      ? String(custom_username).trim().toLowerCase().replace(/[^a-z0-9@_.-]/g, '')
      : await generateUniqueUsername(adminClient, student_name, deptCode)
    const email = `${username}.carmel.in`
    let user_id = null

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email,
      password: 'ams@carmel123',
      email_confirm: true
    })

    if (authData?.user) {
      user_id = authData.user.id
      await adminClient.from('users').insert([{
        id: user_id,
        email: email,
        roles: ['Student'],
        force_password_reset: true
      }])
    }

    const { error: studentError } = await adminClient
      .from('students')
      .insert([{
        name: student_name,
        roll_no: String(roll_no),
        semester_id,
        department_id,
        parent_id,
        user_id,
        username
      }])
      
    if (studentError) {
      console.error("Bulk upload student error:", studentError)
      errorCount++
    } else {
      successCount++
    }
  }

  revalidatePath('/dashboard/tutor/students')
  return { successCount, errorCount }
}

export async function deleteStudent(student_id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  
  const { data: callerProfile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()
    
  if (!callerProfile?.roles?.includes('Admin')) return { error: 'Unauthorized' }
  
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('students').delete().eq('id', student_id)
  
  if (error) {
    return { error: 'Failed to delete student' }
  }
  
  revalidatePath('/dashboard/tutor/students')
  return { success: true }
}

export async function resetParentPassword(parent_id: string) {
  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.updateUserById(parent_id, {
    password: 'ams@carmel123'
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function resetStudentPassword(user_id: string) {
  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.updateUserById(user_id, {
    password: 'ams@carmel123'
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function editStudent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  const { data: userProfile } = await supabase.from('users').select('roles').eq('id', user.id).single()
  if (!userProfile?.roles?.includes('Admin')) return
  
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const roll_no = formData.get('roll_no') as string
  
  if (!id || !name || !roll_no) return
  
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminClient = createAdminClient()
  
  await adminClient.from('students').update({ name, roll_no }).eq('id', id)
  
  revalidatePath('/dashboard/tutor/students')
}
