import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ResetPasswordForm from './ResetPasswordForm'
import styles from './reset.module.css'

export default async function ResetPasswordPage() {
  const supabase = await createClient()

  // Ensure user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Ensure they actually need a reset
  const { data: userProfile } = await supabase
    .from('users')
    .select('force_password_reset')
    .eq('id', user.id)
    .single()

  if (!userProfile?.force_password_reset) {
    redirect('/dashboard')
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Update Your Password</h1>
        <p className={styles.description}>
          For your security, you must change your temporary password before accessing the dashboard.
        </p>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
