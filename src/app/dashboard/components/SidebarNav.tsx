'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from '../dashboard.module.css'
import SidebarSearch from './SidebarSearch'
import { 
  LayoutDashboard, Users, GraduationCap, Megaphone, Clock, BookOpen, 
  CalendarDays, Settings, LineChart, CheckSquare, FileText, Book, 
  FileQuestion, Activity, ClipboardList, PenTool 
} from 'lucide-react'

export default function SidebarNav({ roles }: { roles: string[] }) {
  const pathname = usePathname()

  const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => {
    // Check if the current pathname exactly matches or starts with the href (for sub-routes)
    // but ensure we don't highlight '/dashboard' for '/dashboard/users'
    const isActive = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
    
    return (
      <Link href={href} className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>
        {children}
      </Link>
    )
  }

  return (
    <nav className={styles.sidebarNav}>
      <SidebarSearch />
      <NavLink href="/dashboard">
        <LayoutDashboard size={18} /> Dashboard Home
      </NavLink>
      
      {roles.includes('Admin') && (
        <>
          <div className={styles.navSection}>System Administration</div>
          <NavLink href="/dashboard/users"><Users size={18} /> User Accounts</NavLink>
          <NavLink href="/dashboard/students"><GraduationCap size={18} /> Student & Parent Registry</NavLink>
          <NavLink href="/dashboard/announcements"><Megaphone size={18} /> Announcements</NavLink>
          <NavLink href="/dashboard/faculty/attendance"><CheckSquare size={18} /> Admin Attendance</NavLink>
          
          <div className={styles.navSection}>Academic Setup</div>
          <NavLink href="/dashboard/departments"><Book size={18} /> Departments</NavLink>
          <NavLink href="/dashboard/semesters"><Clock size={18} /> Semesters</NavLink>
          <NavLink href="/dashboard/subjects"><BookOpen size={18} /> Subjects</NavLink>
          <NavLink href="/dashboard/timetables"><CalendarDays size={18} /> Timetables</NavLink>
          <NavLink href="/dashboard/timetables/hours"><Settings size={18} /> Hours Setup</NavLink>
          <NavLink href="/dashboard/faculty"><PenTool size={18} /> Faculty Management</NavLink>
          
          <div className={styles.navSection}>System Overview</div>
          <NavLink href="/dashboard/reports"><LineChart size={18} /> System Reports</NavLink>
        </>
      )}

      {roles.includes('Tutor') && (
        <>
          <div className={styles.navSection}>Class Management</div>
          <NavLink href="/dashboard/tutor/students"><GraduationCap size={18} /> Student Registry</NavLink>
          <NavLink href="/dashboard/timetables"><CalendarDays size={18} /> Timetables</NavLink>
          <NavLink href="/dashboard/announcements"><Megaphone size={18} /> Announcements</NavLink>
          <NavLink href="/dashboard/faculty/attendance"><CheckSquare size={18} /> Course log</NavLink>
          <NavLink href="/dashboard/tutor/oversight"><Activity size={18} /> Class Oversight</NavLink>
          
          <div className={styles.navSection}>Analytics</div>
          <NavLink href="/dashboard/tutor/reports"><LineChart size={18} /> Class Reports</NavLink>
        </>
      )}

      {roles.includes('Faculty') && (
        <>
          <div className={styles.navSection}>Faculty Portal</div>
          <NavLink href="/dashboard/faculty/attendance"><CheckSquare size={18} /> Course log</NavLink>
          <NavLink href="/dashboard/faculty/assignments"><ClipboardList size={18} /> Assignments</NavLink>
          <NavLink href="/dashboard/faculty/tests"><FileText size={18} /> Tests & Exams</NavLink>
          <NavLink href="/dashboard/faculty/materials"><BookOpen size={18} /> Study Materials</NavLink>
          <NavLink href="/dashboard/faculty/reports"><LineChart size={18} /> My Reports</NavLink>
        </>
      )}

      {roles.includes('Parent') && (
        <>
          <div className={styles.navSection}>My Child</div>
          <NavLink href="/dashboard/parent"><Activity size={18} /> Performance</NavLink>
          <NavLink href="/dashboard/student/assignments"><ClipboardList size={18} /> Assignments</NavLink>
          <NavLink href="/dashboard/student/tests"><FileText size={18} /> Tests & Exams</NavLink>
          <NavLink href="/dashboard/student/materials"><BookOpen size={18} /> Study Materials</NavLink>
          <NavLink href="/dashboard/announcements"><Megaphone size={18} /> Announcements</NavLink>
        </>
      )}

      {roles.includes('Student') && (
        <>
          <div className={styles.navSection}>Student Portal</div>
          <NavLink href="/dashboard/student"><Activity size={18} /> My Progress</NavLink>
          <NavLink href="/dashboard/student/assignments"><ClipboardList size={18} /> Assignments</NavLink>
          <NavLink href="/dashboard/student/tests"><FileText size={18} /> Tests & Exams</NavLink>
          <NavLink href="/dashboard/student/materials"><BookOpen size={18} /> Study Materials</NavLink>
          <NavLink href="/dashboard/announcements"><Megaphone size={18} /> Announcements</NavLink>
        </>
      )}

      <div className={styles.navSection}>Resources</div>
      <NavLink href="/dashboard/question-papers"><FileQuestion size={18} /> Question Papers</NavLink>

      <div className={styles.navSection}>Personal Space</div>
      <NavLink href="/dashboard/notes"><PenTool size={18} /> My Notes</NavLink>
    </nav>
  )
}
