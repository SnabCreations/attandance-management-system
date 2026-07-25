'use client'

import { useState } from 'react'
import { promoteSemester } from './actions'
import styles from './semesters.module.css'

export default function PromoteForm({ semesters }: { semesters: any[] }) {
  const [isPending, setIsPending] = useState(false)
  
  async function handleSubmit(formData: FormData) {
    if (!window.confirm("Are you sure? This will move ALL students from the source semester to the destination semester.")) {
      return
    }
    
    setIsPending(true)
    await promoteSemester(formData)
    setIsPending(false)
    ;(document.getElementById('promoteForm') as HTMLFormElement).reset()
  }

  return (
    <form id="promoteForm" action={handleSubmit} className={styles.form}>
      <div className={styles.inputGroup}>
        <label>From Semester (Source)</label>
        <select name="from_semester_id" required className={styles.select}>
          <option value="">Select source batch...</option>
          {semesters?.map((sem) => (
            <option key={sem.id} value={sem.id}>
              {sem.departments?.name} - {sem.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className={styles.inputGroup}>
        <label>To Semester (Destination)</label>
        <select name="to_semester_id" required className={styles.select}>
          <option value="">Select destination batch...</option>
          {semesters?.map((sem) => (
            <option key={sem.id} value={sem.id}>
              {sem.departments?.name} - {sem.name}
            </option>
          ))}
          <option value="alumni">Mark as Alumni / Graduate</option>
        </select>
      </div>
      
      <button type="submit" disabled={isPending} className={styles.button} style={{ backgroundColor: 'var(--accent)' }}>
        {isPending ? 'Promoting...' : 'Promote Batch'}
      </button>
    </form>
  )
}
