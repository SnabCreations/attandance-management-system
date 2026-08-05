'use client'

import { useRef, useState } from 'react'
import styles from '../timetables/timetables.module.css'
import html2canvas from 'html2canvas'
import { ImageDown } from 'lucide-react'

type TimetableSlot = {
  id: string
  faculty_id: string
  subject_id: number
  day_of_week: number
  hour_slot: number
  subjects?: any
  users?: any
}

export default function TimetableViewer({ 
  semester, 
  slots, 
  timeSlots
}: { 
  semester: any
  slots: TimetableSlot[]
  timeSlots?: any[]
}) {
  const days = ['I', 'II', 'III', 'IV', 'V']
  const hours = timeSlots ? timeSlots : Array.from({length: 7}, (_, i) => ({ id: i+1, name: `Hour ${i+1}`, is_break: false, order_index: i+1 }))

  const gridRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadImage = async () => {
    if (!gridRef.current) return
    setIsDownloading(true)
    
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
    return slots.find(s => s.day_of_week === day && s.hour_slot === hour)
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
        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Timetable: {semester.departments?.name} - {semester.name}</h3>
        <button 
          onClick={downloadImage} 
          disabled={isDownloading}
          className={styles.gridControls}
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
                      <td key={ts.id} style={{ padding: '0.5rem', textAlign: 'center' }}>
                        {slot ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word', whiteSpace: 'normal', display: 'inline-block', maxWidth: '100px' }}>{slot.subjects?.name || 'Unknown'}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{slot.users?.email?.split('@')[0] || ''}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>-</span>
                        )}
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
