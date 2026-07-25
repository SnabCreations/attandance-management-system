import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import styles from '../page.module.css'
import { GraduationCap, ClipboardCheck, FileText } from 'lucide-react'

export default async function FacultyPanel({ userId }: { userId: string }) {
  const adminClient = createAdminClient()
  
  const { data: assignments } = await adminClient
    .from('faculty_subjects')
    .select(`
      subject_id,
      subjects (name),
      semesters (name, departments(name))
    `)
    .eq('faculty_id', userId)

  const subjectIds = assignments?.map(a => a.subject_id) || []
  
  let activeAssignments = []
  if (subjectIds.length > 0) {
    const { data: recentAssignments } = await adminClient
      .from('assignments')
      .select('id, title, due_date, subjects(name)')
      .in('subject_id', subjectIds)
      .order('due_date', { ascending: false })
      .limit(3)
    activeAssignments = recentAssignments || []
  }

  return (
    <div className={styles.dashboardSection}>
      <h2 className={styles.sectionTitle}><GraduationCap size={24} /> Faculty Overview</h2>
      
      <div className={styles.grid}>
        <div className={styles.statCard}>
          <h3 className={styles.statTitle}>Subjects Assigned</h3>
          <p className={styles.statNumber}>{assignments?.length || 0}</p>
        </div>
      </div>
      
      {activeAssignments.length > 0 && (
        <div className={styles.fullWidthCard}>
          <h3 className={styles.statTitle} style={{ marginBottom: '1rem' }}>Recent Assignments Created</h3>
          <ul className={styles.list}>
            {activeAssignments.map(a => (
              <li key={a.id} className={styles.listItem}>
                <div>
                  <span className={styles.itemTitle}>{a.title}</span>
                  <div className={styles.itemSubtitle}>{a.subjects?.name}</div>
                </div>
                {a.due_date && <span className={styles.badge}>Due: {new Date(a.due_date).toLocaleDateString()}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className={styles.buttonGroup}>
        <Link href="/dashboard/faculty/attendance" className={styles.actionButton}>
          <ClipboardCheck size={18} /> Log Attendance
        </Link>
        <Link href="/dashboard/faculty/assignments" className={styles.actionButton}>
          <FileText size={18} /> Manage Assignments
        </Link>
      </div>
    </div>
  )
}
