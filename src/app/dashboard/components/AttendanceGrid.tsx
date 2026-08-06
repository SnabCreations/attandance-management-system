'use client'

import styles from './AttendanceGrid.module.css'
import { CheckCircle2, XCircle } from 'lucide-react'

type GridCell = {
  status: string
  subjectName: string
}

type DateRow = {
  date: string
  periods: Record<string, GridCell>
}

export default function AttendanceGrid({ logs }: { logs: any[] }) {
  if (!logs || logs.length === 0) {
    return <p className={styles.emptyState}>No attendance logged yet.</p>
  }

  // Parse logs into a grid structure
  const periodNames = new Set<string>()
  const rowsByDate: Record<string, DateRow> = {}

  logs.forEach(log => {
    const dateKey = log.date
    if (!rowsByDate[dateKey]) {
      rowsByDate[dateKey] = {
        date: dateKey,
        periods: {}
      }
    }

    if (log.attendance_hours && log.attendance_hours.length > 0) {
      log.attendance_hours.forEach((ah: any) => {
        const periodName = ah.time_slots?.name
        if (periodName) {
          periodNames.add(periodName)
          rowsByDate[dateKey].periods[periodName] = {
            status: log.status,
            subjectName: log.subjects?.name || 'Unknown Subject'
          }
        }
      })
    } else {
      // If no specific periods are assigned, treat as 'Full Day'
      periodNames.add('Full Day')
      rowsByDate[dateKey].periods['Full Day'] = {
        status: log.status,
        subjectName: log.subjects?.name || 'Unknown Subject'
      }
    }
  })

  // Sort periods (X-axis) alphabetically or numerically if they are like 'Period 1'
  const sortedPeriods = Array.from(periodNames).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  
  // Sort dates (Y-axis) descending (newest first)
  const sortedDates = Object.values(rowsByDate).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: '#22c55e' }}></div>
          <span>Present</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: '#ef4444' }}></div>
          <span>Absent</span>
        </div>
      </div>
      
      <div className={styles.gridContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              {sortedPeriods.map(period => (
                <th key={period}>{period}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedDates.map(row => (
              <tr key={row.date}>
                <td className={styles.dateCell}>
                  {new Date(row.date).toLocaleDateString()}
                </td>
                {sortedPeriods.map(period => {
                  const cell = row.periods[period]
                  if (!cell) {
                    return <td key={period} className={styles.emptyCell}>-</td>
                  }
                  
                  const isPresent = cell.status === 'Present'
                  
                  return (
                    <td key={period}>
                      <div className={`${styles.statusCell} ${isPresent ? styles.present : styles.absent}`}>
                        {isPresent ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        <span>{cell.status}</span>
                        <div className={styles.tooltip}>{cell.subjectName}</div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Hover over a period to view the specific subject.
      </p>
    </div>
  )
}
