'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { Upload, Download } from 'lucide-react'
import { bulkUploadTimetable } from './actions'

export default function BulkUploadTimetable({ semesterId, onUploadSuccess }: { semesterId: number, onUploadSuccess?: () => void }) {
  const [isUploading, setIsUploading] = useState(false)

  const downloadSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Day,Slot Index,Subject Code,Faculty Email\nMonday,1,CS101,john.doe@example.com\nMonday,2,CS102,jane.smith@example.com\nTuesday,1,CS101,john.doe@example.com"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "sample_timetable.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[]
          const entries = rows.map(row => {
            const dayName = row['Day']?.toString().trim()
            let dayIndex = -1
            if (dayName) {
              const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
              dayIndex = days.findIndex(d => d.toLowerCase() === dayName.toLowerCase()) + 1
            }

            return {
              day_of_week: dayIndex > 0 ? dayIndex : null,
              hour_slot: parseInt(row['Slot Index']?.toString().trim() || '0', 10),
              subject_code: row['Subject Code']?.toString().trim(),
              faculty_email: row['Faculty Email']?.toString().trim()
            }
          }).filter(e => e.day_of_week !== null && e.hour_slot > 0 && e.subject_code && e.faculty_email)

          if (entries.length === 0) {
            alert('No valid entries found in the CSV. Please check the sample format.')
            setIsUploading(false)
            return
          }

          const result = await bulkUploadTimetable(semesterId, entries)
          
          if (result?.error) {
            alert(`Error: ${result.error}`)
          } else {
            alert(`Successfully uploaded ${result?.count || 0} timetable slots!`)
            if (onUploadSuccess) onUploadSuccess()
          }
        } catch (error: any) {
          alert(`Failed to parse CSV: ${error.message}`)
        } finally {
          setIsUploading(false)
          // Reset file input
          e.target.value = ''
        }
      }
    })
  }

  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.5rem 0.75rem',
        borderRadius: '6px',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: isUploading ? 'not-allowed' : 'pointer',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--brand-primary)',
        color: 'white',
        transition: 'all 0.2s ease',
        opacity: isUploading ? 0.7 : 1
      }}>
        <Upload size={16} /> {isUploading ? 'Uploading...' : 'Import CSV'}
        <input 
          type="file" 
          accept=".csv" 
          style={{ display: 'none' }} 
          onChange={handleFileUpload} 
          disabled={isUploading}
        />
      </label>
      <button 
        type="button" 
        onClick={downloadSampleCSV} 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: 'pointer',
          border: '1px solid var(--border-color)',
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = 'var(--text-primary)'
          e.currentTarget.style.borderColor = 'var(--text-secondary)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)'
          e.currentTarget.style.borderColor = 'var(--border-color)'
        }}
      >
        <Download size={16} /> Sample CSV
      </button>
    </div>
  )
}
