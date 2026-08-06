'use client'

import { useState } from 'react'
import { saveGrades } from './actions'
import styles from '../tests.module.css'
import Papa from 'papaparse'
import { Upload, Download } from 'lucide-react'

export default function SpreadsheetGradeForm({ submissions, testId, maxMarks }: { submissions: any[], testId: string, maxMarks: number }) {
  const [isPending, setIsPending] = useState(false)
  const [localSubmissions, setLocalSubmissions] = useState(() => 
    [...submissions].sort((a, b) => String(a.students?.roll_no).localeCompare(String(b.students?.roll_no), undefined, { numeric: true, sensitivity: 'base' }))
  )

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[]
        const updatedSubs = [...localSubmissions]
        let matchCount = 0

        rows.forEach(row => {
          const rollNo = row['Roll No'] || row['roll_no']
          const marks = row['Marks'] || row['marks']
          const status = row['Status'] || row['status'] || 'Evaluated'

          if (rollNo && marks) {
            const index = updatedSubs.findIndex(s => s.students?.roll_no === rollNo.toString())
            if (index !== -1) {
              updatedSubs[index] = { ...updatedSubs[index], marks_obtained: marks, status }
              matchCount++
            }
          }
        })

        setLocalSubmissions(updatedSubs)
        alert(`Imported grades for ${matchCount} students from CSV. Please review and click 'Save All Grades'.`)
      }
    })
  }

  const downloadSampleCSV = () => {
    const csvContent = `data:text/csv;charset=utf-8,Roll No,Status,Marks\n123,Evaluated,${Math.round(maxMarks * 0.8)}\n124,Absent,0\n`
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "sample_test_grades.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    await saveGrades(formData, submissions, testId)
    setIsPending(false)
    alert('Grades saved successfully!')
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'flex-end' }}>
        <label className={styles.uploadBtn}>
          <Upload size={16} /> Import Grades (CSV)
          <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSVUpload} />
        </label>
        <button type="button" onClick={downloadSampleCSV} className={styles.downloadBtn}>
          <Download size={16} /> Sample CSV
        </button>
      </div>
      <form action={handleSubmit}>
        <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Student Name</th>
              <th>Status</th>
              <th>Marks (Out of {maxMarks})</th>
            </tr>
          </thead>
          <tbody>
            {localSubmissions.map((sub: any) => (
              <tr key={sub.id}>
                <td className={styles.rollNo}>{sub.students?.roll_no}</td>
                <td>{sub.students?.name}</td>
                <td>
                  <select 
                    name={`status_${sub.id}`} 
                    value={sub.status || 'Pending'}
                    onChange={(e) => {
                      const updated = [...localSubmissions]
                      const index = updated.findIndex(s => s.id === sub.id)
                      updated[index].status = e.target.value
                      setLocalSubmissions(updated)
                    }}
                    className={styles.selectSmall}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Evaluated">Evaluated</option>
                    <option value="Absent">Absent</option>
                  </select>
                </td>
                <td>
                  <input 
                    type="number" 
                    name={`marks_${sub.id}`} 
                    value={sub.marks_obtained !== null ? sub.marks_obtained : ''}
                    onChange={(e) => {
                      const updated = [...localSubmissions]
                      const index = updated.findIndex(s => s.id === sub.id)
                      updated[index].marks_obtained = e.target.value
                      setLocalSubmissions(updated)
                    }}
                    min="0"
                    max={maxMarks}
                    className={styles.inputSmall}
                    placeholder={`e.g. ${Math.round(maxMarks * 0.8)}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <button type="submit" disabled={isPending} className={styles.button} style={{ marginTop: '1.5rem' }}>
        {isPending ? 'Saving Grades...' : 'Save All Grades'}
      </button>
    </form>
    </div>
  )
}
