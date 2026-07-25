import styles from './dashboard.module.css'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

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
    .select('roles, force_password_reset')
    .eq('id', user.id)
    .single()

  if (userProfile?.force_password_reset) {
    redirect('/reset-password')
  }

  const roles = userProfile?.roles || ['Unassigned']
  
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Carmel AMS</h2>
          <span className={styles.roleBadge}>{roles.join(', ')}</span>
        </div>
        
        <nav className={styles.sidebarNav}>
          <Link href="/dashboard" className={styles.navLink}>
            Dashboard Home
          </Link>
          
          {roles.includes('Admin') && (
            <>
              <div className={styles.navSection}>System Administration</div>
              <Link href="/dashboard/users" className={styles.navLink}>User Accounts</Link>
              <Link href="/dashboard/faculty/attendance" className={styles.navLink}>Fallback Attendance</Link>
              
              <div className={styles.navSection}>Academic Setup</div>
              <Link href="/dashboard/departments" className={styles.navLink}>Departments</Link>
              <Link href="/dashboard/semesters" className={styles.navLink}>Semesters</Link>
              <Link href="/dashboard/subjects" className={styles.navLink}>Subjects</Link>
              <Link href="/dashboard/faculty" className={styles.navLink}>Faculty Management</Link>
              
              <div className={styles.navSection}>System Overview</div>
              <Link href="/dashboard/reports" className={styles.navLink}>System Reports</Link>
            </>
          )}

          {roles.includes('Tutor') && (
            <>
              <div className={styles.navSection}>Class Management</div>
              <Link href="/dashboard/tutor/students" className={styles.navLink}>Student Registry</Link>
              <Link href="/dashboard/faculty/attendance" className={styles.navLink}>Log Attendance</Link>
              <Link href="/dashboard/tutor/oversight" className={styles.navLink}>Class Oversight</Link>
              
              <div className={styles.navSection}>Analytics</div>
              <Link href="/dashboard/tutor/reports" className={styles.navLink}>Class Reports</Link>
            </>
          )}

          {roles.includes('Faculty') && (
            <>
              <div className={styles.navSection}>Teaching</div>
              <Link href="/dashboard/faculty/attendance" className={styles.navLink}>Log Attendance</Link>
              <Link href="/dashboard/faculty/assignments" className={styles.navLink}>Assignments</Link>
            </>
          )}

          {roles.includes('Parent') && (
            <>
              <div className={styles.navSection}>My Child</div>
              <Link href="/dashboard/parent" className={styles.navLink}>Performance</Link>
            </>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userEmail}>{user.email}</div>
          <form action="/auth/signout" method="post">
            <button type="submit" className={styles.signOutButton}>
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          {/* Topbar content could go here (e.g. mobile toggle) */}
        </header>
        <div className={styles.pageContent}>
          {children}
        </div>
      </main>
    </div>
  )
}
