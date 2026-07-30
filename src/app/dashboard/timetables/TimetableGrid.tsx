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
  subjects,
  timeSlots
}: { 
  semester: any
  slots: TimetableSlot[]
  faculties: any[]
  subjects: any[]
  timeSlots?: any[]
}) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  // fallback to generic hours if no time_slots passed
  const hours = timeSlots ? timeSlots : Array.from({length: 7}, (_, i) => ({ id: i+1, name: `Hour ${i+1}`, is_break: false, order_index: i+1 }))

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
              <th>Day / Slot</th>
              {hours.map((ts: any) => (
                <th key={ts.id}>{ts.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((dayName, dayIndex) => {
              const dayOfWeek = dayIndex + 1
              return (
                <tr key={dayOfWeek}>
                  <td className={styles.dayLabel}>{dayName}</td>
                  {hours.map((ts: any) => {
                    if (ts.is_break) {
                      return <td key={ts.id} style={{ backgroundColor: 'rgba(0,0,0,0.05)', textAlign: 'center', color: 'var(--muted)' }}>Break</td>
                    }
                    const slot = getSlot(dayOfWeek, ts.id)
                    return (
                      <td key={ts.id}>
                        <form action={updateTimetableSlot} className={styles.cellForm}>
                          <input type="hidden" name="semester_id" value={semester.id} />
                          <input type="hidden" name="day_of_week" value={dayOfWeek} />
                          <input type="hidden" name="hour_slot" value={ts.id} />
                          
                          <select name="subject_id" defaultValue={slot?.subject_id || ""} className={styles.selectSmall} style={{ maxWidth: '120px' }}>
                            <option value="">- Subject -</option>
                            {subjects.map(sub => (
                              <option key={sub.id} value={sub.id} title={sub.name}>
                                {sub.code || sub.name.substring(0, 15)}
                              </option>
                            ))}
                          </select>
                          
                          <select name="faculty_id" defaultValue={slot?.faculty_id || ""} className={styles.selectSmall} style={{ maxWidth: '120px' }}>
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
