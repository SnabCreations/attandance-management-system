import { createClient } from '@/utils/supabase/server'
import styles from './adminReports.module.css'

export default async function AdminReportsPage() {
  const supabase = await createClient()

  // 1. Fetch aggregate counts
  const [{ count: studentCount }, { count: facultyCount }, { count: deptCount }] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'Faculty'),
    supabase.from('departments').select('*', { count: 'exact', head: true })
  ])

  // 2. Fetch all attendance logs to calculate a global average
  const { data: allAttendance } = await supabase
    .from('attendance')
    .select('status')
  
  const { data: recentStudents } = await supabase
    .from('students')
    .select('id, name, created_at, semesters(name, departments(name))')
    .order('created_at', { ascending: false })
    .limit(5)
    
  const { data: recentTests } = await supabase
    .from('tests')
    .select('id, title, test_date, max_marks, subjects(name)')
    .order('created_at', { ascending: false })
    .limit(5)
  
  const totalLogs = allAttendance?.length || 0
  const presentLogs = allAttendance?.filter(a => a.status === 'Present').length || 0
  const globalAttendance = totalLogs > 0 ? Math.round((presentLogs / totalLogs) * 100) : 0

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>System Overview & Reports</h1>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Students</h3>
          <div className={styles.value}>{studentCount || 0}</div>
        </div>
        
        <div className={styles.statCard} title="Total number of users currently holding the Faculty role in the system">
          <h3>Active Faculty</h3>
          <div className={styles.value}>{facultyCount || 0}</div>
        </div>
        
        <div className={styles.statCard}>
          <h3>Departments</h3>
          <div className={styles.value}>{deptCount || 0}</div>
        </div>

        <div className={styles.statCard}>
          <h3>Global Attendance</h3>
          <div className={`${styles.value} ${globalAttendance < 75 ? styles.textDanger : styles.textSuccess}`}>
            {globalAttendance}%
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.card}>
          <h2>Recent Enrollments</h2>
          {recentStudents && recentStudents.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentStudents.map((s: any) => (
                <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <strong>{s.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {s.semesters?.departments?.name} - {s.semesters?.name}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.subtitle}>No recent enrollments.</p>
          )}
        </div>

        <div className={styles.card}>
          <h2>Recent Tests Scheduled</h2>
          {recentTests && recentTests.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentTests.map((t: any) => (
                <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <strong>{t.title}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {t.subjects?.name} ({t.max_marks} marks)
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(t.test_date).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.subtitle}>No tests scheduled yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
