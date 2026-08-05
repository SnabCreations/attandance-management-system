import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import styles from '../../page.module.css'

export default async function StudentAssignmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  
  // Find all students for this parent OR this student user
  const { data: students } = await adminClient
    .from('students')
    .select('id, name, roll_no, semester_id')
    .or(`parent_id.eq.${user.id},user_id.eq.${user.id}`)

  const studentIds = students?.map(s => s.id) || []
  
  let assignments: any[] = []
  if (studentIds.length > 0) {
    const { data: fetchAssignments } = await adminClient
      .from('student_assignments')
      .select('id, status, marks, assignments(title, due_date, subjects(name)), students(name)')
      .in('student_id', studentIds)
      .order('id', { ascending: false })
      
    assignments = fetchAssignments || []
  }

  return (
    <div className={styles.container}>
      <Link href="/dashboard" style={{ color: 'var(--accent)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        &larr; Back to Dashboard
      </Link>
      <div className={styles.dashboardSection}>
        <h2 className={styles.sectionTitle}>Assignments</h2>
        <div className={styles.fullWidthCard}>
          <ul className={styles.list}>
            {assignments.map(sa => (
              <li key={sa.id} className={styles.listItem}>
                <div>
                  <span className={styles.itemTitle}>{sa.assignments?.title}</span>
                  <div className={styles.itemSubtitle}>
                    {sa.assignments?.subjects?.name} • For: {sa.students?.name}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {sa.assignments?.due_date && <span className={styles.itemSubtitle} style={{ marginRight: '1rem' }}>Due: {new Date(sa.assignments.due_date).toLocaleDateString()}</span>}
                  {sa.marks != null && <span className={styles.itemSubtitle} style={{ marginRight: '1rem', fontWeight: 600 }}>Score: {sa.marks}</span>}
                  <span className={`${styles.badge} ${sa.status === 'Pending' ? styles.badgePending : styles.badgeDone}`}>
                    {sa.status}
                  </span>
                </div>
              </li>
            ))}
            {assignments.length === 0 && (
              <p className={styles.itemSubtitle}>No assignments found.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
