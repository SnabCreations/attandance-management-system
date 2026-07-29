'use client'

import { useState } from 'react'
import { updateTimetableSlot } from './actions'
import styles from './timetables.module.css'

type TimetableSlot = {
  id: string
  faculty_id: string
  subject_id: number
  day_of_week: number
  hour_slot: number
}

export default function TimetableGrid({ 
  semester, 
  slots, 
  faculties, 
  subjects 
}: { 
  semester: any
  slots: TimetableSlot[]
  faculties: any[]
  subjects: any[]
}) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const hours = [1, 2, 3, 4, 5, 6, 7]

  const getSlot = (day: number, hour: number) => {
    return slots.find(s => s.day_of_week === day && s.hour_slot === hour)
  }

  return (
    <div className={styles.card}>
      <h3>{semester.departments?.name} - {semester.name}</h3>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Day / Hour</th>
              {hours.map(h => <th key={h}>Hour {h}</th>)}
            </tr>
          </thead>
          <tbody>
            {days.map((dayName, dayIndex) => {
              const dayOfWeek = dayIndex + 1
              return (
                <tr key={dayOfWeek}>
                  <td className={styles.dayLabel}>{dayName}</td>
                  {hours.map(hour => {
                    const slot = getSlot(dayOfWeek, hour)
                    return (
                      <td key={hour}>
                        <form action={updateTimetableSlot} className={styles.cellForm}>
                          <input type="hidden" name="semester_id" value={semester.id} />
                          <input type="hidden" name="day_of_week" value={dayOfWeek} />
                          <input type="hidden" name="hour_slot" value={hour} />
                          
                          <select name="subject_id" defaultValue={slot?.subject_id || ""} className={styles.selectSmall}>
                            <option value="">- Subject -</option>
                            {subjects.map(sub => (
                              <option key={sub.id} value={sub.id}>{sub.code}</option>
                            ))}
                          </select>
                          
                          <select name="faculty_id" defaultValue={slot?.faculty_id || ""} className={styles.selectSmall}>
                            <option value="">- Faculty -</option>
                            {faculties.map(fac => (
                              <option key={fac.id} value={fac.id}>{fac.email.split('@')[0]}</option>
                            ))}
                          </select>
                          
                          <button type="submit" className={styles.saveBtn}>Save</button>
                        </form>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
