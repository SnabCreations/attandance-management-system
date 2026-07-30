import { createClient } from '@/utils/supabase/server'
import styles from './page.module.css'
import AdminPanel from './components/AdminPanel'
import TutorPanel from './components/TutorPanel'
import FacultyPanel from './components/FacultyPanel'
import ParentPanel from './components/ParentPanel'
import Greeting from './components/Greeting'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userProfile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  const roles = userProfile?.roles || []

  if (roles.length === 0 || roles.includes('Unassigned')) {
    return (
      <div className={styles.container}>
        <div className={styles.dashboardSection}>
          <h2 className={styles.sectionTitle}>Welcome to Carmel AMS</h2>
          <p>Your account is currently unassigned. Please contact an administrator to assign your role.</p>
        </div>
      </div>
    )
  }

  const name = user.email ? user.email.split('@')[0] : 'User'
  // Capitalize first letter
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1)

  return (
    <div className={styles.container}>
      <Greeting name={formattedName} />
      {roles.includes('Admin') && <AdminPanel />}
      {roles.includes('Tutor') && <TutorPanel userId={user.id} />}
      {roles.includes('Faculty') && <FacultyPanel userId={user.id} />}
      {roles.includes('Parent') && <ParentPanel userId={user.id} />}
    </div>
  )
}
