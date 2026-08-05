import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import styles from '../../page.module.css'

export default async function StudentTestsPage() {
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
  
  let tests: any[] = []
  if (studentIds.length > 0) {
    const { data: fetchTests } = await adminClient
      .from('student_tests')
      .select('id, status, marks, tests(name, test_date, subjects(name)), students(name)')
      .in('student_id', studentIds)
      .order('id', { ascending: false })
      
    tests = fetchTests || []
  }

  return (
    <div className={styles.container}>
      <Link href="/dashboard" style={{ color: 'var(--accent)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        &larr; Back to Dashboard
      </Link>
      <div className={styles.dashboardSection}>
        <h2 className={styles.sectionTitle}>Tests & Scores</h2>
        <div className={styles.fullWidthCard}>
          <ul className={styles.list}>
            {tests.map(st => (
              <li key={st.id} className={styles.listItem}>
                <div>
                  <span className={styles.itemTitle}>{st.tests?.name}</span>
                  <div className={styles.itemSubtitle}>
                    {st.tests?.subjects?.name} • For: {st.students?.name}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {st.tests?.test_date && <span className={styles.itemSubtitle} style={{ marginRight: '1rem' }}>Date: {new Date(st.tests.test_date).toLocaleDateString()}</span>}
                  {st.marks != null && <span className={styles.itemSubtitle} style={{ marginRight: '1rem', fontWeight: 600 }}>Score: {st.marks}</span>}
                  <span className={`${styles.badge} ${st.status === 'Pending' ? styles.badgePending : styles.badgeDone}`}>
                    {st.status}
                  </span>
                </div>
              </li>
            ))}
            {tests.length === 0 && (
              <p className={styles.itemSubtitle}>No tests found.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
