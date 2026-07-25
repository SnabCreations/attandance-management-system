import { createAdminClient } from '@/utils/supabase/admin'
import styles from '../page.module.css'
import { UserCircle2 } from 'lucide-react'

export default async function ParentPanel({ userId }: { userId: string }) {
  const adminClient = createAdminClient()
  
  const { data: students } = await adminClient
    .from('students')
    .select('id, name, roll_no, semesters(name, departments(name))')
    .eq('parent_id', userId)

  const studentIds = students?.map(s => s.id) || []
  
  let latestAssignments = []
  if (studentIds.length > 0) {
    const { data: assignments } = await adminClient
      .from('student_assignments')
      .select('id, status, marks, assignments(title, due_date, subjects(name)), students(name)')
      .in('student_id', studentIds)
      .order('id', { ascending: false })
      .limit(10)
      
    if (assignments) {
      // Sort so 'Pending' is on top, then by due_date desc
      latestAssignments = assignments.sort((a: any, b: any) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1
        if (a.status !== 'Pending' && b.status === 'Pending') return 1
        
        const dateA = new Date(a.assignments?.due_date || 0).getTime()
        const dateB = new Date(b.assignments?.due_date || 0).getTime()
        return dateB - dateA
      })
    }
  }

  return (
    <div className={styles.dashboardSection}>
      <h2 className={styles.sectionTitle}><UserCircle2 size={24} /> Student Panel</h2>
      
      <div className={styles.grid}>
        {students?.map(student => (
          <div key={student.id} className={styles.statCard} style={{ textAlign: 'left' }}>
            <h3 className={styles.statTitle}>{student.roll_no}</h3>
            <p className={styles.statNumber} style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>{student.name}</p>
            <p className={styles.itemSubtitle} style={{ marginTop: '0.5rem' }}>
              {student.semesters?.departments?.name} - {student.semesters?.name}
            </p>
          </div>
        ))}
        {(!students || students.length === 0) && (
          <div className={styles.statCard}>
            <p className={styles.itemSubtitle}>No students linked to this account yet.</p>
          </div>
        )}
      </div>
      
      {latestAssignments.length > 0 && (
        <div className={styles.fullWidthCard}>
          <h3 className={styles.statTitle} style={{ marginBottom: '1rem' }}>Latest Assignments</h3>
          <ul className={styles.list}>
            {latestAssignments.map((sa: any) => (
              <li key={sa.id} className={styles.listItem}>
                <div>
                  <span className={styles.itemTitle}>{sa.assignments?.title}</span>
                  <div className={styles.itemSubtitle}>
                    {sa.assignments?.subjects?.name} • For: {sa.students?.name}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {sa.assignments?.due_date && <span className={styles.itemSubtitle} style={{ marginRight: '1rem' }}>Due: {new Date(sa.assignments.due_date).toLocaleDateString()}</span>}
                  <span className={`${styles.badge} ${sa.status === 'Pending' ? styles.badgePending : styles.badgeDone}`}>
                    {sa.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
