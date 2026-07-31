'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addTimeSlot(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: userProfile } = await supabase.from('users').select('roles').eq('id', user.id).single()
  if (!userProfile?.roles?.includes('Admin')) return

  const name = formData.get('name') as string
  const start_time = formData.get('start_time') as string
  const end_time = formData.get('end_time') as string
  const is_break = formData.get('is_break') === 'true'
  const semester_id = formData.get('semester_id') as string

  if (!name || !start_time || !end_time) return

  const parsedSemesterId = semester_id ? parseInt(semester_id) : null

  // Get current max order
  let query = supabase.from('time_slots').select('order_index').order('order_index', { ascending: false }).limit(1)
  
  if (parsedSemesterId) {
    query = query.eq('semester_id', parsedSemesterId)
  } else {
    query = query.is('semester_id', null)
  }

  const { data: maxOrderData } = await query.single()
    
  const nextOrder = (maxOrderData?.order_index || 0) + 1

  await supabase.from('time_slots').insert([{
    name,
    start_time,
    end_time,
    is_break,
    order_index: nextOrder,
    semester_id: parsedSemesterId
  }])

  if (parsedSemesterId) {
    revalidatePath(`/dashboard/timetables/hours?semester_id=${parsedSemesterId}`)
  } else {
    revalidatePath('/dashboard/timetables/hours')
  }
}

export async function deleteTimeSlot(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: userProfile } = await supabase.from('users').select('roles').eq('id', user.id).single()
  if (!userProfile?.roles?.includes('Admin')) return

  const id = formData.get('id') as string
  if (!id) return

  await supabase.from('time_slots').delete().eq('id', parseInt(id))
  
  revalidatePath('/dashboard/timetables/hours')
}
