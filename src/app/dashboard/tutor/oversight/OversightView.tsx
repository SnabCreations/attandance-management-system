'use client'

import { useState } from 'react'
import { fetchRecentLogs } from './actions'
import styles from '../reports/reports.module.css'

export default function OversightView({ semesters }: { semesters: any[] }) {
  const [selectedSemester, setSelectedSemester] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [logsData, setLogsData] = useState<any[] | null>(null)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSemester) return

    setIsGenerating(true)
    const data = await fetchRecentLogs(parseInt(selectedSemester))
    setLogsData(data)
    setIsGenerating(false)
  }

  return (
    <div>
      <form onSubmit={handleGenerate} className={styles.controls}>
        <div className={styles.inputGroup}>
          <label htmlFor="semester_id">Select Batch</label>
          <select 
            id="semester_id" 
            value={selectedSemester} 
            onChange={(e) => setSelectedSemester(e.target.value)}
            className={styles.select}
            required
          >
            <option value="">Choose a semester...</option>
            {semesters.map(sem => (
              <option key={sem.id} value={sem.id}>
                {sem.departments?.name} - {sem.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={isGenerating || !selectedSemester} className={styles.button}>
          {isGenerating ? 'Loading...' : 'View Recent Logs'}
        </button>
      </form>

      {logsData && (
        <div className={styles.reportSection}>
          {logsData.length === 0 ? (
            <p className={styles.emptyState}>No attendance logs found for this batch recently.</p>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student Name</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Timeline (Slots)</th>
                    <th>Extra?</th>
                  </tr>
                </thead>
                <tbody>
                  {logsData.map(log => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.date).toLocaleDateString()}</td>
                      <td className={styles.studentName}>{log.students?.name}</td>
                      <td>{log.subjects?.name}</td>
                      <td>
                        <span className={`${styles.alertBadge} ${log.status === 'Present' ? styles.goodBadge : styles.alertBadge}`}>
                          {log.status}
                        </span>
                      </td>
                      <td>
                        {log.attendance_hours && log.attendance_hours.length > 0 ? (
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {log.attendance_hours.map((ah: any, idx: number) => (
                              <span key={idx} style={{ 
                                backgroundColor: 'var(--bg-canvas)', 
                                border: '1px solid var(--border-color)', 
                                padding: '0.125rem 0.375rem', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)'
                              }}>
                                {ah.time_slots?.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{log.hours} Hrs (Legacy)</span>
                        )}
                      </td>
                      <td>{log.is_extra_hours ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
