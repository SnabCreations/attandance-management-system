import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import styles from '../../page.module.css'

export default async function FacultyReportsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { month } = await searchParams
  
  // Default to current month YYYY-MM
  const currentMonth = month || new Date().toISOString().slice(0, 7)
  const [yearStr, monthStr] = currentMonth.split('-')
  const startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0).toISOString().split('T')[0]

  const adminClient = createAdminClient()
  
  // Fetch attendance records for this faculty in the selected month
  const { data: attendanceRecords } = await adminClient
    .from('attendance')
    .select('date, hours, subject_id, subjects(name)')
    .eq('faculty_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)

  // Since attendance is recorded per student, we need to find unique sessions.
  // A unique session is defined by (date, subject_id) combination.
  const uniqueSessions: Record<string, any> = {}
  let totalHours = 0

  if (attendanceRecords) {
    attendanceRecords.forEach(record => {
      const key = `${record.date}_${record.subject_id}`
      if (!uniqueSessions[key]) {
        uniqueSessions[key] = {
          date: record.date,
          subject: (record.subjects as any)?.name,
          hours: record.hours
        }
        totalHours += record.hours
      }
    })
  }
  
  const sessionList = Object.values(uniqueSessions).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link href="/dashboard" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className={styles.dashboardSection}>
        <h2 className={styles.sectionTitle}>Monthly Teaching Report</h2>
        
        <div className={styles.fullWidthCard} style={{ marginBottom: '2rem' }}>
          <form style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label htmlFor="month" style={{ fontWeight: 600 }}>Select Month:</label>
            <input 
              type="month" 
              id="month" 
              name="month" 
              defaultValue={currentMonth} 
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
            />
            <button type="submit" className={styles.actionButton} style={{ padding: '0.5rem 1rem' }}>
              View Report
            </button>
          </form>
        </div>

        <div className={styles.grid}>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Total Hours Taught</h3>
            <p className={styles.statNumber} style={{ fontSize: '2.5rem', color: 'var(--accent)' }}>{totalHours}</p>
            <p className={styles.itemSubtitle}>In {currentMonth}</p>
          </div>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Total Sessions</h3>
            <p className={styles.statNumber} style={{ fontSize: '2.5rem' }}>{sessionList.length}</p>
            <p className={styles.itemSubtitle}>In {currentMonth}</p>
          </div>
        </div>

        <div className={styles.fullWidthCard} style={{ marginTop: '2rem' }}>
          <h3 className={styles.statTitle} style={{ marginBottom: '1.5rem' }}>Session Details</h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Subject</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Hours Logged</th>
              </tr>
            </thead>
            <tbody>
              {sessionList.map((session: any, index: number) => (
                <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 500 }}>{new Date(session.date).toLocaleDateString()}</td>
                  <td style={{ padding: '0.75rem' }}>{session.subject}</td>
                  <td style={{ padding: '0.75rem' }}>{session.hours}</td>
                </tr>
              ))}
              {sessionList.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No sessions logged for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
