'use client'

import { useState, useEffect } from 'react'
import { submitAttendance } from './actions'
import styles from './attendance.module.css'
import { createClient } from '@/utils/supabase/client'
import Papa from 'papaparse'
import { Search, Download, Upload, ArrowUpDown } from 'lucide-react'

export default function AttendanceForm({ assignments, allStudents, timeSlots }: { assignments: any[], allStudents: any[], timeSlots: any[] }) {
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedSem, setSelectedSem] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isExtra, setIsExtra] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('asc')
  
  const [presentStudents, setPresentStudents] = useState<Set<number>>(new Set())
  const [markedHours, setMarkedHours] = useState<{ slotId: number, facultyName: string }[]>([])

  const supabase = createClient()

  const currentAssignment = assignments.find(a => a.subject_id.toString() === selectedSubject)
  
  const currentStudents = currentAssignment 
    ? allStudents.filter(s => s.semester_id === currentAssignment.semester_id)
    : []

  // Unique departments from assignments
  const departments = Array.from(new Map(assignments.map(a => [a.department_id, { id: a.department_id, name: a.department_name }])).values())
  
  // Unique semesters based on selected dept
  let semesters = Array.from(new Map(assignments.map(a => [a.semester_id, { id: a.semester_id, name: a.semester_name, department_id: a.department_id }])).values())
  if (selectedDept) {
    semesters = semesters.filter((s: any) => s.department_id === parseInt(selectedDept))
  }

  // Filtered assignments based on dept and sem
  let filteredAssignments = assignments
  if (selectedDept) filteredAssignments = filteredAssignments.filter(a => a.department_id === parseInt(selectedDept))
  if (selectedSem) filteredAssignments = filteredAssignments.filter(a => a.semester_id === parseInt(selectedSem))

  useEffect(() => {
    setPresentStudents(new Set())
  }, [selectedSubject])

  // Reset subject when dept or sem changes
  useEffect(() => {
    setSelectedSubject('')
  }, [selectedDept, selectedSem])

  useEffect(() => {
    async function fetchMarkedHours() {
      if (!selectedSubject || !date) {
        setMarkedHours([])
        return
      }
      
      const { data, error } = await supabase
        .from('faculty_teaching_logs')
        .select(`
          time_slot_id,
          users (email, raw_user_meta_data)
        `)
        .eq('subject_id', parseInt(selectedSubject))
        .eq('date', date)
        
      if (data && !error) {
        const hours = data.map((log: any) => {
          const facultyName = log.users?.raw_user_meta_data?.name || log.users?.email || 'Faculty'
          return {
            slotId: log.time_slot_id,
            facultyName: facultyName
          }
        })
        setMarkedHours(hours)
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

  // Filter class hours using fallback logic (semester-specific, or global)
  const allClassHours = timeSlots.filter(t => !t.is_break)
  let classHours = allClassHours.filter(t => t.semester_id === currentAssignment?.semester_id)
  if (classHours.length === 0) {
    classHours = allClassHours.filter(t => t.semester_id === null)
  }

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
          <label htmlFor="dept_id">Department</label>
          <select 
            id="dept_id" 
            className={styles.select}
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d: any) => d.id && (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="sem_id">Semester</label>
          <select 
            id="sem_id" 
            className={styles.select}
            value={selectedSem}
            onChange={(e) => setSelectedSem(e.target.value)}
          >
            <option value="">All Semesters</option>
            {semesters.map((s: any) => s.id && (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

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
            {filteredAssignments.map((a: any) => (
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
              const markedBy = markedHours.filter(m => m.slotId === slot.id)
              const isMarked = markedBy.length > 0
              
              return (
                <label key={slot.id} className={`${styles.timeSlotCard} ${isMarked ? styles.timeSlotCardMarked : ''}`}>
                  <input type="checkbox" name="time_slots" value={slot.id} />
                  <div className={styles.timeSlotContent}>
                    <span className={styles.timeSlotName}>{slot.name}</span>
                    <span className={styles.timeSlotTime}>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                    {isMarked && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                        Marked by: {markedBy.map(m => m.facultyName).join(', ')}
                      </span>
                    )}
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
