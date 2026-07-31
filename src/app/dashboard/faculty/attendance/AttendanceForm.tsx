'use client'

import { useState, useEffect } from 'react'
import { submitAttendance } from './actions'
import styles from './attendance.module.css'
import { createClient } from '@/utils/supabase/client'
import Papa from 'papaparse'
import { Search, Download, Upload, ArrowUpDown } from 'lucide-react'

export default function AttendanceForm({ assignments, allStudents, timeSlots }: { assignments: any[], allStudents: any[], timeSlots: any[] }) {
  const [selectedSubject, setSelectedSubject] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isExtra, setIsExtra] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('asc')
  
  const [presentStudents, setPresentStudents] = useState<Set<number>>(new Set())
  const [markedHours, setMarkedHours] = useState<number[]>([])

  const supabase = createClient()

  const currentAssignment = assignments.find(a => a.subject_id.toString() === selectedSubject)
  
  const currentStudents = currentAssignment 
    ? allStudents.filter(s => s.semester_id === currentAssignment.semester_id)
    : []

  useEffect(() => {
    setPresentStudents(new Set())
  }, [selectedSubject])

  useEffect(() => {
    async function fetchMarkedHours() {
      if (!selectedSubject || !date) {
        setMarkedHours([])
        return
      }
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          attendance_hours (time_slot_id)
        `)
        .eq('subject_id', parseInt(selectedSubject))
        .eq('date', date)
        
      if (data && !error) {
        const hours = new Set<number>()
        data.forEach((att: any) => {
          att.attendance_hours?.forEach((ah: any) => {
            hours.add(ah.time_slot_id)
          })
        })
        setMarkedHours(Array.from(hours))
      }
    }
    fetchMarkedHours()
  }, [selectedSubject, date])

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    await submitAttendance(formData, currentStudents)
    setIsPending(false)
    alert('Attendance logged successfully!')
    setMarkedHours([])
    setDate(new Date().toISOString().split('T')[0])
  }

  const classHours = timeSlots.filter(t => !t.is_break)

  const handleMarkAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setPresentStudents(new Set(currentStudents.map(s => s.id)))
    } else {
      setPresentStudents(new Set())
    }
  }

  const handleStudentToggle = (id: number) => {
    setPresentStudents(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[]
        const presentIds = new Set<number>()
        rows.forEach(row => {
          const rollNo = row['Roll No'] || row['roll_no']
          const status = row['Status'] || row['status']
          if (rollNo && status) {
            const student = currentStudents.find(s => s.roll_no === rollNo.toString())
            if (student && status.toLowerCase() === 'present') {
              presentIds.add(student.id)
            }
          }
        })
        setPresentStudents(presentIds)
        alert(`Imported ${presentIds.size} present students from CSV.`)
      }
    })
  }

  const downloadSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Roll No,Status\n123,Present\n124,Absent\n"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "sample_attendance.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredAndSortedStudents = currentStudents
    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.roll_no.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.roll_no.localeCompare(b.roll_no)
      return b.roll_no.localeCompare(a.roll_no)
    })

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
            {classHours.map(slot => {
              const isMarked = markedHours.includes(slot.id)
              return (
                <label key={slot.id} className={`${styles.timeSlotCard} ${isMarked ? styles.timeSlotCardMarked : ''}`}>
                  <input type="checkbox" name="time_slots" value={slot.id} />
                  <div className={styles.timeSlotContent}>
                    <span className={styles.timeSlotName}>{slot.name} {isMarked && '(Logged)'}</span>
                    <span className={styles.timeSlotTime}>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                  </div>
                </label>
              )
            })}
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
          <div className={styles.studentListHeader}>
            <h3>Mark Attendance</h3>
            
            <div className={styles.studentListActions}>
              <div className={styles.searchBox}>
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search student..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className={styles.csvControls}>
                <label className={styles.uploadBtn}>
                  <Upload size={16} /> Import CSV
                  <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSVUpload} />
                </label>
                <button type="button" onClick={downloadSampleCSV} className={styles.downloadBtn}>
                  <Download size={16} /> Sample CSV
                </button>
              </div>
            </div>
          </div>
          
          <p className={styles.helpText}>Check the box to mark students Present.</p>
          
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Roll No <ArrowUpDown size={14} style={{ display: 'inline', marginLeft: '4px' }} />
                  </th>
                  <th>Name</th>
                  <th>
                    <label className={styles.markAllLabel}>
                      <input 
                        type="checkbox" 
                        onChange={handleMarkAll} 
                        checked={presentStudents.size > 0 && presentStudents.size === currentStudents.length}
                      />
                      Mark Everyone Present
                    </label>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedStudents.map((student: any) => (
                  <tr key={student.id}>
                    <td className={styles.rollNo}>{student.roll_no}</td>
                    <td>{student.name}</td>
                    <td>
                      <div className={styles.toggleWrapper}>
                        <input 
                          type="checkbox" 
                          name={`present_${student.id}`} 
                          className={styles.presentCheckbox}
                          checked={presentStudents.has(student.id)}
                          onChange={() => handleStudentToggle(student.id)}
                        />
                        <span className={styles.presentLabel}>Present</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAndSortedStudents.length === 0 && (
              <p className={styles.emptyState}>No students match your search.</p>
            )}
          </div>
          
          <button type="submit" disabled={isPending} className={styles.button}>
            {isPending ? 'Saving...' : 'Submit Attendance'}
          </button>
        </div>
      )}
    </form>
  )
}
