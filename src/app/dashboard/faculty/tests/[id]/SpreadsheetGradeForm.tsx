'use client'

import { useState } from 'react'
import { saveGrades } from './actions'
import styles from '../tests.module.css'

export default function SpreadsheetGradeForm({ submissions, testId, maxMarks }: { submissions: any[], testId: string, maxMarks: number }) {
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    await saveGrades(formData, submissions, testId)
    setIsPending(false)
    alert('Grades saved successfully!')
  }

  return (
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
            {submissions.map((sub: any) => (
              <tr key={sub.id}>
                <td className={styles.rollNo}>{sub.students?.roll_no}</td>
                <td>{sub.students?.name}</td>
                <td>
                  <select 
                    name={`status_${sub.id}`} 
                    defaultValue={sub.status || 'Pending'}
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
                    defaultValue={sub.marks_obtained !== null ? sub.marks_obtained : ''}
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
  )
}
