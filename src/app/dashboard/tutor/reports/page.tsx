import { createClient } from '@/utils/supabase/server'
import styles from './reports.module.css'
import ReportView from './ReportView'

export default async function TutorReportsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userProfile } = await supabase.from('users').select('roles').eq('id', user.id).single()
  const isAdmin = userProfile?.roles?.includes('Admin')

  let semesterQuery = supabase
    .from('semesters')
    .select('id, name, departments(name)')
    .order('department_id')

  if (!isAdmin) {
    semesterQuery = semesterQuery.eq('tutor_id', user.id)
  }

  const { data: semesters } = await semesterQuery

  if (!isAdmin && (!semesters || semesters.length === 0)) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Class Reports & Analytics</h1>
          <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '2rem' }}>You have not been assigned as a Tutor to any batch. Please contact the administrator.</p>
        </div>
      </div>
    )
  }

  // We will fetch the students and their stats in a server action or client component when a semester is selected.
  // Given we want real-time dynamic data without page reloads, we'll pass the initial structure to a Client component.
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Class Reports & Analytics</h1>
        <p className={styles.subtitle}>
          Select a semester batch to generate a comprehensive report of student attendance and academic performance.
        </p>
      </div>

      <div className={styles.card}>
        <ReportView semesters={semesters || []} />
      </div>
    </div>
  )
}
