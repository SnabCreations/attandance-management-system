import { createClient } from '@/utils/supabase/server'
import styles from '../reports/reports.module.css'
import OversightView from './OversightView'

export default async function TutorOversightPage() {
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
          <h1 className={styles.title}>Class Oversight</h1>
          <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '2rem' }}>You have not been assigned as a Tutor to any batch. Please contact the administrator.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Class Oversight</h1>
        <p className={styles.subtitle}>
          Review daily attendance logs submitted by faculty for your batch.
        </p>
      </div>

      <div className={styles.card}>
        <OversightView semesters={semesters || []} />
      </div>
    </div>
  )
}
