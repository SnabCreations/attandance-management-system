import styles from './dashboard.module.css'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

import DashboardShell from './DashboardShell'
import SidebarSearch from './components/SidebarSearch'
import AvatarUpload from './components/AvatarUpload'
import { 
  LayoutDashboard, Users, GraduationCap, Megaphone, Clock, BookOpen, 
  CalendarDays, Settings, LineChart, CheckSquare, FileText, Book, 
  FileQuestion, Activity, ClipboardList, PenTool 
} from 'lucide-react'

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
        
        <nav className={styles.sidebarNav}>
          <SidebarSearch />
          <Link href="/dashboard" className={styles.navLink}>
            <LayoutDashboard size={18} /> Dashboard Home
          </Link>
          
          {roles.includes('Admin') && (
            <>
              <div className={styles.navSection}>System Administration</div>
              <Link href="/dashboard/users" className={styles.navLink}><Users size={18} /> User Accounts</Link>
              <Link href="/dashboard/students" className={styles.navLink}><GraduationCap size={18} /> Student & Parent Registry</Link>
              <Link href="/dashboard/announcements" className={styles.navLink}><Megaphone size={18} /> Announcements</Link>
              <Link href="/dashboard/faculty/attendance" className={styles.navLink}><CheckSquare size={18} /> Fallback Attendance</Link>
              
              <div className={styles.navSection}>Academic Setup</div>
              <Link href="/dashboard/departments" className={styles.navLink}><Book size={18} /> Departments</Link>
              <Link href="/dashboard/semesters" className={styles.navLink}><Clock size={18} /> Semesters</Link>
              <Link href="/dashboard/subjects" className={styles.navLink}><BookOpen size={18} /> Subjects</Link>
              <Link href="/dashboard/timetables" className={styles.navLink}><CalendarDays size={18} /> Timetables</Link>
              <Link href="/dashboard/timetables/hours" className={styles.navLink}><Settings size={18} /> Hours Setup</Link>
              <Link href="/dashboard/faculty" className={styles.navLink}><PenTool size={18} /> Faculty Management</Link>
              
              <div className={styles.navSection}>System Overview</div>
              <Link href="/dashboard/reports" className={styles.navLink}><LineChart size={18} /> System Reports</Link>
            </>
          )}

          {roles.includes('Tutor') && (
            <>
              <div className={styles.navSection}>Class Management</div>
              <Link href="/dashboard/tutor/students" className={styles.navLink}><GraduationCap size={18} /> Student Registry</Link>
              <Link href="/dashboard/timetables" className={styles.navLink}><CalendarDays size={18} /> Timetables</Link>
              <Link href="/dashboard/announcements" className={styles.navLink}><Megaphone size={18} /> Announcements</Link>
              <Link href="/dashboard/faculty/attendance" className={styles.navLink}><CheckSquare size={18} /> Course log</Link>
              <Link href="/dashboard/tutor/oversight" className={styles.navLink}><Activity size={18} /> Class Oversight</Link>
              
              <div className={styles.navSection}>Analytics</div>
              <Link href="/dashboard/tutor/reports" className={styles.navLink}><LineChart size={18} /> Class Reports</Link>
            </>
          )}

          {roles.includes('Faculty') && (
            <>
              <div className={styles.navSection}>Faculty Portal</div>
              <Link href="/dashboard/faculty/attendance" className={styles.navLink}><CheckSquare size={18} /> Course log</Link>
              <Link href="/dashboard/faculty/assignments" className={styles.navLink}><ClipboardList size={18} /> Assignments</Link>
              <Link href="/dashboard/faculty/tests" className={styles.navLink}><FileText size={18} /> Tests & Exams</Link>
              <Link href="/dashboard/faculty/materials" className={styles.navLink}><BookOpen size={18} /> Study Materials</Link>
              <Link href="/dashboard/faculty/reports" className={styles.navLink}><LineChart size={18} /> My Reports</Link>
            </>
          )}

          {roles.includes('Parent') && (
            <>
              <div className={styles.navSection}>My Child</div>
              <Link href="/dashboard/parent" className={styles.navLink}><Activity size={18} /> Performance</Link>
              <Link href="/dashboard/student/assignments" className={styles.navLink}><ClipboardList size={18} /> Assignments</Link>
              <Link href="/dashboard/student/tests" className={styles.navLink}><FileText size={18} /> Tests & Exams</Link>
              <Link href="/dashboard/student/materials" className={styles.navLink}><BookOpen size={18} /> Study Materials</Link>
              <Link href="/dashboard/announcements" className={styles.navLink}><Megaphone size={18} /> Announcements</Link>
            </>
          )}

          <div className={styles.navSection}>Resources</div>
          <Link href="/dashboard/question-papers" className={styles.navLink}><FileQuestion size={18} /> Question Papers</Link>

          <div className={styles.navSection}>Personal Space</div>
          <Link href="/dashboard/notes" className={styles.navLink}><PenTool size={18} /> My Notes</Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <div style={{ padding: '0 1rem 1rem 1rem', fontSize: '0.7rem', opacity: 0.5, textAlign: 'center', lineHeight: '1.4', color: 'var(--text-primary)' }}>
            &copy; 2026 Carmel MEAMS. All Rights Reserved.<br/>
            A Product of Carmel Polytechnic College<br/>
            Designed &amp; Developed by Snab Creations
          </div>
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
