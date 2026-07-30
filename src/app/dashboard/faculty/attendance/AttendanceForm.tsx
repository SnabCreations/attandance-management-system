'use client'

import { useState } from 'react'
import { submitAttendance } from './actions'
import styles from './attendance.module.css'

export default function AttendanceForm({ assignments, allStudents, timeSlots }: { assignments: any[], allStudents: any[], timeSlots: any[] }) {
  const [selectedSubject, setSelectedSubject] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
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

  // Filter out breaks for selection
  const classHours = timeSlots.filter(t => !t.is_break)

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

        <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
          <label>Select Time Slots (Hours Taught)</label>
          <div className={styles.timeSlotGrid}>
            {classHours.map(slot => (
              <label key={slot.id} className={styles.timeSlotCard}>
                <input type="checkbox" name="time_slots" value={slot.id} />
                <div className={styles.timeSlotContent}>
                  <span className={styles.timeSlotName}>{slot.name}</span>
                  <span className={styles.timeSlotTime}>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                </div>
              </label>
            ))}
            {classHours.length === 0 && <span style={{ color: 'var(--muted)' }}>No time slots configured. Contact Admin.</span>}
          </div>
        </div>

        <div className={styles.checkboxGroup} style={{ gridColumn: '1 / -1' }}>
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
