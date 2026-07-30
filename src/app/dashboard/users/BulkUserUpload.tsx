'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { bulkAddUsers } from './actions'

export default function BulkUserUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [status, setStatus] = useState('')

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
        const res = await bulkAddUsers(data)
        if (res?.error) {
          setStatus(`Error: ${res.error}`)
        } else {
          setStatus(`Success! Added ${res?.count} users.`)
          setTimeout(() => setStatus(''), 5000)
        }
      } catch (err: any) {
        setStatus(`Parsing error: ${err.message}`)
      } finally {
        setIsUploading(false)
        e.target.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px dashed #cbd5e1', borderRadius: '8px', background: '#f8fafc' }}>
      <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 600 }}>Bulk Upload Users (CSV/Excel)</h4>
      
      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
        Columns required: <strong>Email</strong>, <strong>Role</strong> (e.g. Admin, Faculty, Tutor)
        <a 
          href={`data:text/csv;charset=utf-8,${encodeURIComponent('Email,Role\nfaculty1@carmelpoly.in,Faculty\nfaculty2@carmelpoly.in,Faculty')}`}
          download="sample_faculty.csv"
          style={{ marginLeft: '1rem', color: '#2563eb', textDecoration: 'underline' }}
        >
          Download Sample CSV
        </a>
      </p>
      <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} disabled={isUploading} />
      {status && <p style={{ fontSize: '0.875rem', marginTop: '0.75rem', color: '#059669', fontWeight: 500 }}>{status}</p>}
    </div>
  )
}
