import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import styles from '../../page.module.css'
import ExportReportButton from './ExportReportButton'

export default async function FacultyReportsPage({ searchParams }: { searchParams: Promise<{ start?: string, end?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { start, end } = await searchParams
  
  // Default to current month YYYY-MM-DD
  const today = new Date()
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
  
  const startDate = start || defaultStart
  const endDate = end || defaultEnd

  const adminClient = createAdminClient()
  
  // Fetch actual teaching logs for this faculty
  const { data: teachingLogs } = await adminClient
    .from('faculty_teaching_logs')
    .select('date, subject_id, subjects(name)')
    .eq('faculty_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)

  // Group by (date, subject_id) to count hours
  const uniqueSessions: Record<string, any> = {}
  let totalHours = 0

  if (teachingLogs) {
    teachingLogs.forEach(log => {
      const key = `${log.date}_${log.subject_id}`
      if (!uniqueSessions[key]) {
        uniqueSessions[key] = {
          date: log.date,
          subject: (log.subjects as any)?.name,
          hours: 1
        }
      } else {
        uniqueSessions[key].hours += 1
      }
      totalHours += 1
    })
  }
  
  const sessionList = Object.values(uniqueSessions).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return new Date(dateStr).toLocaleDateString('en-GB').replace(/\//g, '-');
  };

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
          <form style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label htmlFor="start" style={{ fontWeight: 600 }}>Start Date:</label>
            <input 
              type="date" 
              id="start" 
              name="start" 
              defaultValue={startDate} 
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
            />
            <label htmlFor="end" style={{ fontWeight: 600 }}>End Date:</label>
            <input 
              type="date" 
              id="end" 
              name="end" 
              defaultValue={endDate} 
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
            />
            <button type="submit" className={styles.actionButton} style={{ padding: '0.5rem 1rem' }}>
              Filter Report
            </button>
          </form>
        </div>

        <div className={styles.grid}>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Total Hours Taught</h3>
            <p className={styles.statNumber} style={{ fontSize: '2.5rem', color: 'var(--accent)' }}>{totalHours}</p>
            <p className={styles.itemSubtitle}>From {formatDate(startDate)} to {formatDate(endDate)}</p>
          </div>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Total Sessions</h3>
            <p className={styles.statNumber} style={{ fontSize: '2.5rem' }}>{sessionList.length}</p>
            <p className={styles.itemSubtitle}>From {formatDate(startDate)} to {formatDate(endDate)}</p>
          </div>
        </div>

        <div className={styles.fullWidthCard} style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 className={styles.statTitle} style={{ margin: 0 }}>Session Details</h3>
            <ExportReportButton sessions={sessionList} startDate={startDate} endDate={endDate} />
          </div>
          
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
                  <td style={{ padding: '0.75rem', fontWeight: 500 }}>{formatDate(session.date)}</td>
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
