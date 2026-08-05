import styles from './dashboard.module.css'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

import DashboardShell from './DashboardShell'
import AvatarUpload from './components/AvatarUpload'
import SidebarNav from './components/SidebarNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('roles, force_password_reset, avatar_url')
    .eq('id', user.id)
    .single()

  if (userProfile?.force_password_reset) {
    redirect('/reset-password')
  }

  const roles = userProfile?.roles || ['Unassigned']
  
  const sidebarContent = (
    <>
        <div className={styles.sidebarHeader}>
          <img 
            src="/meams-logo-text.webp" 
            alt="Carmel MEAMS" 
            style={{ width: '120px', height: 'auto', marginBottom: '0.5rem' }} 
          />
          <span className={styles.roleBadge}>{roles.join(', ')}</span>
        </div>
        
        <SidebarNav roles={roles} />

        <div className={styles.sidebarFooter}>
          <AvatarUpload userId={user.id} initialAvatarUrl={userProfile?.avatar_url || null} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div className={styles.userEmail} style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.email}</div>
            <form action="/auth/signout" method="post" style={{ marginTop: '0.25rem' }}>
              <button type="submit" className={styles.signOutButton}>
                Sign Out
              </button>
            </form>
          </div>
        </div>
    </>
  )

  return (
    <DashboardShell sidebarContent={sidebarContent}>
      {children}
    </DashboardShell>
  )
}
