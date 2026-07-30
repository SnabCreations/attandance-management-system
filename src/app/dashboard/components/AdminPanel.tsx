import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import AdminDashboardChart from './AdminDashboardChart'
import styles from '../page.module.css'
import { Users, GraduationCap, LayoutDashboard, AlertCircle } from 'lucide-react'

export default async function AdminPanel() {
  const adminClient = createAdminClient()
  
  const { count: studentCount } = await adminClient.from('students').select('*', { count: 'exact', head: true })
  const { count: facultyCount } = await adminClient.from('users').select('*', { count: 'exact', head: true }).contains('roles', ['Faculty'])
  
  // For the chart, let's fetch students per department
  const { data: depts } = await adminClient.from('departments').select('id, name')
  const { data: students } = await adminClient.from('students').select('semester_id, semesters(department_id)')
  
  const chartData = (depts || []).map((d: any) => {
    const studentCount = (students || []).filter((s: any) => s.semesters?.department_id === d.id).length
    return { name: d.name, students: studentCount }
  })

  return (
    <div className={styles.dashboardSection}>
      <h2 className={styles.sectionTitle}><LayoutDashboard size={24} /> Admin Overview</h2>
      
      <div className={styles.grid}>
        <div className={styles.statCard}>
          <h3 className={styles.statTitle}>Total Students</h3>
          <p className={styles.statNumber}>{studentCount || 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statTitle}>Total Faculty</h3>
          <p className={styles.statNumber}>{facultyCount || 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3 className={styles.statTitle}>System Alerts</h3>
          <p className={styles.statNumberError}>0</p>
        </div>
      </div>
      
      <div className={styles.fullWidthCard}>
        <h3 className={styles.statTitle} style={{ marginBottom: '1rem' }}>Students by Department</h3>
        <div className={styles.graphContainer}>
          {chartData.length > 0 ? (
            <AdminDashboardChart data={chartData} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              No data available
            </div>
          )}
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <Link href="/dashboard/users" className={styles.actionButton}>
          <Users size={18} /> Manage Users
        </Link>
        <Link href="/dashboard/reports" className={styles.actionButton}>
          <LayoutDashboard size={18} /> System Reports
        </Link>
      </div>
    </div>
  )
}
