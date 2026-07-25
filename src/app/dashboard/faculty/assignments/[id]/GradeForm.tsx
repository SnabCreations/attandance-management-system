'use client'

import { useState } from 'react'
import { saveGrades } from './actions'
import styles from '../assignments.module.css'

export default function GradeForm({ submissions, assignmentId }: { submissions: any[], assignmentId: string }) {
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    await saveGrades(formData, submissions, assignmentId)
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
              <th>Marks (Out of 100)</th>
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
                    defaultValue={sub.status}
                    className={styles.selectSmall}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Late">Late</option>
                  </select>
                </td>
                <td>
                  <input 
                    type="number" 
                    name={`marks_${sub.id}`} 
                    defaultValue={sub.marks || ''}
                    min="0"
                    max="100"
                    className={styles.inputSmall}
                    placeholder="e.g. 85"
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
