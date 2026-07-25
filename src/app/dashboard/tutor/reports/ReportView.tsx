'use client'

import { useState } from 'react'
import { generateSemesterReport } from './actions'
import styles from './reports.module.css'

export default function ReportView({ semesters }: { semesters: any[] }) {
  const [selectedSemester, setSelectedSemester] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState<any[] | null>(null)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSemester) return

    setIsGenerating(true)
    const data = await generateSemesterReport(parseInt(selectedSemester))
    setReportData(data)
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
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </button>
      </form>

      {reportData && (
        <div className={styles.reportSection}>
          {reportData.length === 0 ? (
            <p className={styles.emptyState}>No students found in this semester batch.</p>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Attendance %</th>
                    <th>Avg Marks</th>
                    <th>Missing Assignments</th>
                    <th>Status Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map(student => {
                    const isLowAttendance = student.attendancePercentage < 75
                    const hasMissing = student.missingAssignments > 0

                    return (
                      <tr key={student.id}>
                        <td className={styles.rollNo}>{student.roll_no}</td>
                        <td className={styles.studentName}>{student.name}</td>
                        <td>
                          <span className={`${styles.metric} ${isLowAttendance ? styles.textDanger : styles.textSuccess}`}>
                            {student.attendancePercentage}%
                          </span>
                        </td>
                        <td>
                          <span className={styles.metric}>
                            {student.avgMarks}%
                          </span>
                        </td>
                        <td>
                          <span className={hasMissing ? styles.textWarning : ''}>
                            {student.missingAssignments}
                          </span>
                        </td>
                        <td>
                          {isLowAttendance ? (
                            <span className={styles.alertBadge}>Low Attendance</span>
                          ) : (
                            <span className={styles.goodBadge}>On Track</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
