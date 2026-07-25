'use client'

import { useState } from 'react'
import { submitAttendance } from './actions'
import styles from './attendance.module.css'

export default function AttendanceForm({ assignments, allStudents }: { assignments: any[], allStudents: any[] }) {
  const [selectedSubject, setSelectedSubject] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [hours, setHours] = useState('1')
  const [isExtra, setIsExtra] = useState(false)
  const [isPending, setIsPending] = useState(false)

  // Find the selected assignment to know which semester the students belong to
  const currentAssignment = assignments.find(a => a.subject_id.toString() === selectedSubject)
  
  // Filter students based on the selected subject's semester
  const currentStudents = currentAssignment 
    ? allStudents.filter(s => s.semester_id === currentAssignment.semester_id)
    : []

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    await submitAttendance(formData, currentStudents)
    setIsPending(false)
    alert('Attendance logged successfully!')
  }

  return (
    <form action={handleSubmit} className={styles.form}>
      <div className={styles.headerControls}>
        <div className={styles.inputGroup}>
          <label htmlFor="subject_id">Subject</label>
          <select 
            id="subject_id" 
            name="subject_id" 
            required 
            className={styles.select}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">Select a Subject...</option>
            {assignments.map((a: any) => (
              <option key={a.subject_id} value={a.subject_id}>
                {a.subjects?.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="date">Date</label>
          <input 
            type="date" 
            id="date" 
            name="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required 
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="hours">Hours Taught</label>
          <input 
            type="number" 
            id="hours" 
            name="hours" 
            min="1" 
            max="6" 
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required 
            className={styles.input}
          />
        </div>

        <div className={styles.checkboxGroup}>
          <input 
            type="checkbox" 
            id="is_extra" 
            name="is_extra" 
            checked={isExtra}
            onChange={(e) => setIsExtra(e.target.checked)}
          />
          <label htmlFor="is_extra">Extra Hours / Event</label>
        </div>
      </div>

      {currentStudents.length > 0 && (
        <div className={styles.studentList}>
          <h3>Mark Attendance</h3>
          <p className={styles.helpText}>By default, all students are marked Present. Check the box to mark them Absent.</p>
          
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Status (Absent?)</th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.map((student: any) => (
                  <tr key={student.id}>
                    <td className={styles.rollNo}>{student.roll_no}</td>
                    <td>{student.name}</td>
                    <td>
                      <div className={styles.toggleWrapper}>
                        <input 
                          type="checkbox" 
                          name={`absent_${student.id}`} 
                          className={styles.absentCheckbox}
                        />
                        <span className={styles.absentLabel}>Mark Absent</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button type="submit" disabled={isPending} className={styles.button}>
            {isPending ? 'Saving...' : 'Submit Attendance'}
          </button>
        </div>
      )}
    </form>
  )
}
