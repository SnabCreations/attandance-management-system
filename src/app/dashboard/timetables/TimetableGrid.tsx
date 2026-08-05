'use client'

import { useState, useRef } from 'react'
import { saveAllTimetableSlots } from './actions'
import BulkUploadTimetable from './BulkUploadTimetable'
import styles from './timetables.module.css'
import html2canvas from 'html2canvas'
import { ImageDown } from 'lucide-react'

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
  const days = ['I', 'II', 'III', 'IV', 'V']
  const hours = timeSlots ? timeSlots : Array.from({length: 7}, (_, i) => ({ id: i+1, name: `Hour ${i+1}`, is_break: false, order_index: i+1 }))

  const gridRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  
  // Initialize local state with passed slots
  const [localSlots, setLocalSlots] = useState<TimetableSlot[]>(slots || [])
  const [isSaving, setIsSaving] = useState(false)
  
  const handleSlotChange = (day: number, hour: number, field: 'subject_id' | 'faculty_id', value: string) => {
    setLocalSlots(prev => {
      const existing = prev.find(s => s.day_of_week === day && s.hour_slot === hour)
      if (existing) {
        return prev.map(s => s.day_of_week === day && s.hour_slot === hour ? { ...s, [field]: value } : s)
      } else {
        return [...prev, { id: '', day_of_week: day, hour_slot: hour, subject_id: field === 'subject_id' ? Number(value) : 0, faculty_id: field === 'faculty_id' ? value : '' }]
      }
    })
  }

  const handleSaveAll = async () => {
    setIsSaving(true)
    const result = await saveAllTimetableSlots(semester.id, localSlots)
    setIsSaving(false)
    if (result?.error) {
      alert(result.error)
    } else {
      alert('Timetable saved successfully!')
    }
  }

  const downloadImage = async () => {
    if (!gridRef.current) return
    setIsDownloading(true)
    
    // Add capturing class to hide buttons and style selects for print
    gridRef.current.classList.add(styles.capturing)
    
    try {
      const canvas = await html2canvas(gridRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      })
      
      const image = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = image
      link.download = `${semester.departments?.name}_${semester.name}_Timetable.png`
      link.click()
    } catch (err) {
      console.error("Failed to download image", err)
      alert("Failed to generate timetable image.")
    } finally {
      gridRef.current.classList.remove(styles.capturing)
      setIsDownloading(false)
    }
  }

  const getSlot = (day: number, hour: number) => {
    return localSlots.find(s => s.day_of_week === day && s.hour_slot === hour)
  }

  return (
    <div className={styles.card} ref={gridRef}>
      <div className={styles.printHeader}>
        <img src="/carmel.webp" alt="Carmel Logo" className={styles.printLogo} />
        <div className={styles.printTitles}>
          <h2>CARMEL POLYTECHNIC COLLEGE</h2>
          <h3>Academic Timetable - {semester.departments?.name} ({semester.name})</h3>
        </div>
        <img src="/meams-logo-text.webp" alt="MEAMS Logo" className={styles.printLogo} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }} className={styles.gridHeader}>
        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{semester.departments?.name} - {semester.name}</h3>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }} className={styles.gridControls}>
          <BulkUploadTimetable semesterId={semester.id} onUploadSuccess={() => window.location.reload()} />
          <button 
            onClick={downloadImage} 
            disabled={isDownloading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              border: '1px solid var(--border-color)',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              transition: 'all 0.2s ease',
              opacity: isDownloading ? 0.7 : 1
            }}
          >
            <ImageDown size={16} /> {isDownloading ? 'Saving...' : 'Save as Image'}
          </button>
          <button 
            onClick={handleSaveAll}
            disabled={isSaving}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
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
                        <div className={styles.cellForm}>
                          <select 
                            value={slot?.subject_id || ""} 
                            onChange={(e) => handleSlotChange(dayOfWeek, ts.id, 'subject_id', e.target.value)}
                            className={styles.selectSmall}
                          >
                            <option value="">- Subject -</option>
                            {subjects.map(sub => (
                              <option key={sub.id} value={sub.id} title={sub.name}>
                                {sub.name}
                              </option>
                            ))}
                          </select>
                          
                          <select 
                            value={slot?.faculty_id || ""} 
                            onChange={(e) => handleSlotChange(dayOfWeek, ts.id, 'faculty_id', e.target.value)}
                            className={styles.selectSmall}
                          >
                            <option value="">- Faculty -</option>
                            {faculties.map(fac => (
                              <option key={fac.id} value={fac.id}>{fac.email.split('@')[0]}</option>
                            ))}
                          </select>
                        </div>
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
