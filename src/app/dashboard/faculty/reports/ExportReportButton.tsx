'use client'

import { Download } from 'lucide-react'
import Papa from 'papaparse'

export default function ExportReportButton({ sessions, startDate, endDate }: { sessions: any[], startDate: string, endDate: string }) {
  const handleExport = () => {
    if (sessions.length === 0) {
      alert("No sessions to export.")
      return
    }

    // Format data for CSV
    const csvData = sessions.map(session => ({
      'Date': new Date(session.date).toLocaleDateString(),
      'Subject': session.subject,
      'Hours Logged': session.hours
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `teaching_report_${startDate}_to_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button 
      onClick={handleExport}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontWeight: 500,
        cursor: 'pointer',
        fontSize: '0.875rem'
      }}
    >
      <Download size={16} /> Export to CSV
    </button>
  )
}
