'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { bulkAddSemesters } from './actions'

export default function BulkSemesterUpload({ departments }: { departments: any[] }) {
  const [isUploading, setIsUploading] = useState(false)
  const [status, setStatus] = useState('')
  const [departmentId, setDepartmentId] = useState<number>(0)

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
        const res = await bulkAddSemesters(data, departmentId)
        if (res?.error) {
          setStatus(`Error: ${res.error}`)
        } else {
          setStatus(`Success! Added ${res?.count} semesters.`)
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
    <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px dashed var(--border-dark)', borderRadius: '8px', background: 'var(--bg-canvas)' }}>
      <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Bulk Upload Semesters (CSV/Excel)</h4>
      
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="bulk_department_id" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>Select Department</label>
        <select 
          id="bulk_department_id" 
          value={departmentId} 
          onChange={(e) => setDepartmentId(parseInt(e.target.value))}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-dark)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
        >
          <option value={0}>Select a Department...</option>
          {departments?.map((dept: any) => (
             <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Columns required: <strong style={{ color: 'var(--text-primary)' }}>Name</strong>
        <a 
          href={`data:text/csv;charset=utf-8,${encodeURIComponent('Name\nSemester 7\nSemester 8')}`}
          download="sample_semesters.csv"
          style={{ marginLeft: '1rem', color: 'var(--brand-primary)', textDecoration: 'underline' }}
        >
          Download Sample CSV
        </a>
      </p>
      <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} disabled={isUploading || !departmentId} style={{ color: 'var(--text-primary)' }} />
      {status && <p style={{ fontSize: '0.875rem', marginTop: '0.75rem', color: '#059669', fontWeight: 500 }}>{status}</p>}
      {!departmentId && <p style={{ fontSize: '0.875rem', marginTop: '0.75rem', color: '#ef4444' }}>Please select a department first before uploading.</p>}
    </div>
  )
}
