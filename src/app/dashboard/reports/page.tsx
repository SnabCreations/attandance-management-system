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
        
        <div className={styles.statCard}>
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

      <div className={styles.card}>
        <h2>Recent System Activity</h2>
        <p className={styles.subtitle}>More detailed system-wide analytics will be rendered here.</p>
        <div className={styles.placeholderBox}>
          Analytics Dashboard Visualization Space
        </div>
      </div>
    </div>
  )
}
