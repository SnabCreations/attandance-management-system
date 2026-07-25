import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import styles from '../page.module.css'
import { BookOpen, Users, ClipboardCheck } from 'lucide-react'

export default async function TutorPanel({ userId }: { userId: string }) {
  const adminClient = createAdminClient()
  
  const { data: semesters } = await adminClient
    .from('semesters')
    .select('id, name, departments(name)')
    .eq('tutor_id', userId)

  const semesterIds = semesters?.map(s => s.id) || []
  
  let studentCount = 0
  if (semesterIds.length > 0) {
    const { count } = await adminClient
      .from('students')
      .select('*', { count: 'exact', head: true })
      .in('semester_id', semesterIds)
    studentCount = count || 0
  }

  return (
    <div className={styles.dashboardSection}>
      <h2 className={styles.sectionTitle}><BookOpen size={24} /> Tutor Overview</h2>
      
      <div className={styles.grid}>
        <div className={styles.statCard}>
          <h3 className={styles.statTitle}>Assigned Classes</h3>
          <p className={styles.statNumber}>{semesters?.length || 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statTitle}>Total Students</h3>
          <p className={styles.statNumber}>{studentCount}</p>
        </div>
      </div>
      
      {semesters && semesters.length > 0 && (
        <div className={styles.fullWidthCard}>
          <h3 className={styles.statTitle} style={{ marginBottom: '1rem' }}>Your Classes</h3>
          <ul className={styles.list}>
            {semesters.map(sem => (
              <li key={sem.id} className={styles.listItem}>
                <div>
                  <span className={styles.itemTitle}>{sem.name}</span>
                  <div className={styles.itemSubtitle}>{sem.departments?.name}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className={styles.buttonGroup}>
        <Link href="/dashboard/tutor/students" className={styles.actionButton}>
          <Users size={18} /> Student Registry
        </Link>
        <Link href="/dashboard/faculty/attendance" className={styles.actionButton}>
          <ClipboardCheck size={18} /> Fallback Attendance
        </Link>
      </div>
    </div>
  )
}
