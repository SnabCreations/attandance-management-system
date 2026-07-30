'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { bulkAddSubjects } from './actions'

export default function BulkSubjectUpload({ semesters }: { semesters: any[] }) {
  const [isUploading, setIsUploading] = useState(false)
  const [status, setStatus] = useState('')
  const [semesterId, setSemesterId] = useState<number>(0)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setStatus('Parsing file...')

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = JSON.parse(JSON.stringify(XLSX.utils.sheet_to_json(ws)))
        
        setStatus('Uploading to database...')
        const res = await bulkAddSubjects(data, semesterId)
        if (res?.error) {
          setStatus(`Error: ${res.error}`)
        } else {
          setStatus(`Success! Added ${res?.count} subjects.`)
          setTimeout(() => setStatus(''), 3000)
        }
      } catch (err: any) {
        setStatus(`Parsing error: ${err.message}`)
      } finally {
        setIsUploading(false)
        e.target.value = '' // reset
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px dashed #cbd5e1', borderRadius: '8px', background: '#f8fafc' }}>
      <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 600 }}>Bulk Upload Subjects (CSV/Excel)</h4>
      
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="bulk_semester_id" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Select Semester</label>
        <select 
          id="bulk_semester_id" 
          value={semesterId} 
          onChange={(e) => setSemesterId(parseInt(e.target.value))}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
        >
          <option value={0}>Select a Semester...</option>
          {semesters?.map((sem: any) => (
            <option key={sem.id} value={sem.id}>
              {sem.departments?.name} - {sem.name}
            </option>
          ))}
        </select>
      </div>

      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
        Columns required: <strong>Code</strong>, <strong>Name</strong>
        <a 
          href={`data:text/csv;charset=utf-8,${encodeURIComponent('Code,Name\nCS101,Introduction to Programming\nCS102,Data Structures')}`}
          download="sample_subjects.csv"
          style={{ marginLeft: '1rem', color: '#2563eb', textDecoration: 'underline' }}
        >
          Download Sample CSV
        </a>
      </p>
      <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} disabled={isUploading || !semesterId} />
      {status && <p style={{ fontSize: '0.875rem', marginTop: '0.75rem', color: '#059669', fontWeight: 500 }}>{status}</p>}
      {!semesterId && <p style={{ fontSize: '0.875rem', marginTop: '0.75rem', color: '#ef4444' }}>Please select a semester first before uploading.</p>}
    </div>
  )
}
