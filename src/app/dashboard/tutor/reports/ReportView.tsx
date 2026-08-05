'use client'

import { useState } from 'react'
import { generateSemesterReport } from './actions'
import styles from './reports.module.css'

export default function ReportView({ semesters }: { semesters: any[] }) {
  const [selectedSemester, setSelectedSemester] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState<any[] | null>(null)
  const [statusFilter, setStatusFilter] = useState('All')

  const filteredData = reportData?.filter(student => {
    if (statusFilter === 'Low Attendance' && student.attendancePercentage >= 75) return false
    if (statusFilter === 'Missing Assignments' && student.missingAssignments === 0) return false
    return true
  })

  function downloadCSV() {
    if (!filteredData) return
    const headers = ['Roll No', 'Student Name', 'Attendance %', 'Avg Marks', 'Missing Assignments', 'Status Alert']
    const rows = filteredData.map(student => [
      student.roll_no,
      student.name,
      student.attendancePercentage,
      student.avgMarks,
      student.missingAssignments,
      student.attendancePercentage < 75 ? 'Low Attendance' : 'On Track'
    ])
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "class_report.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Filter Status:</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={styles.select} style={{ width: 'auto', padding: '0.375rem 0.75rem' }}>
                <option value="All">All Students</option>
                <option value="Low Attendance">Low Attendance (&lt;75%)</option>
                <option value="Missing Assignments">Missing Assignments</option>
              </select>
            </div>
            <button onClick={downloadCSV} className={styles.button} style={{ padding: '0.5rem 1rem', width: 'auto', backgroundColor: '#10b981' }}>
              Download CSV
            </button>
          </div>

          {!filteredData || filteredData.length === 0 ? (
            <p className={styles.emptyState}>No students found matching the criteria.</p>
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
                  {filteredData.map(student => {
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
