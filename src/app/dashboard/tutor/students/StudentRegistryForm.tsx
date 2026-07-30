'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import styles from './students.module.css'
import { addStudentAndParent, bulkUploadStudents } from './actions'
import { useRouter } from 'next/navigation'

export default function StudentRegistryForm({ semesters }: { semesters: any[] }) {
  const [isBulkUpload, setIsBulkUpload] = useState(false)
  const [uploadData, setUploadData] = useState<any[]>([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data = JSON.parse(JSON.stringify(XLSX.utils.sheet_to_json(ws)))
      setUploadData(data)
    }
    reader.readAsBinaryString(file)
  }

  const handleBulkSubmit = async () => {
    if (!selectedSemester || uploadData.length === 0) return
    setIsSubmitting(true)
    
    const [semester_id, department_id] = selectedSemester.split('_')
    const result = await bulkUploadStudents(uploadData, parseInt(semester_id), parseInt(department_id))
    
    setIsSubmitting(false)
    if (result.errorCount > 0) {
      alert(`Uploaded with ${result.successCount} successes and ${result.errorCount} errors.`)
    } else {
      alert(`Successfully uploaded ${result.successCount} students.`)
    }
    setUploadData([])
    setSelectedSemester('')
    router.refresh()
  }

  return (
    <div className={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Register New Student</h2>
        <button 
          onClick={() => setIsBulkUpload(!isBulkUpload)}
          className={styles.secondaryButton}
        >
          {isBulkUpload ? 'Switch to Single Entry' : 'Bulk Excel Upload'}
        </button>
      </div>

      {isBulkUpload ? (
        <div className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="bulk_semester">Semester & Department</label>
            <select 
              id="bulk_semester" 
              value={selectedSemester} 
              onChange={(e) => setSelectedSemester(e.target.value)} 
              required 
              className={styles.select}
            >
              <option value="">Select a Semester...</option>
              {semesters?.map((sem: any) => (
                <option key={sem.id} value={`${sem.id}_${sem.department_id}`}>
                  {sem.departments?.name} - {sem.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup} style={{ marginTop: '1rem' }}>
            <label>Upload Excel File</label>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
              Format: Columns should be named "Student Name", "Roll No", "Parent Email" (optional). 
              <a 
                href={`data:text/csv;charset=utf-8,${encodeURIComponent('Student Name,Roll No,Parent Email\nJohn Doe,ME101,parent1@example.com\nJane Smith,ME102,parent2@example.com')}`}
                download="sample_students.csv"
                style={{ marginLeft: '0.5rem', color: '#2563eb', textDecoration: 'underline' }}
              >
                Download Sample CSV
              </a>
            </p>
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
          </div>

          {uploadData.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p>{uploadData.length} rows ready to upload.</p>
              <button 
                onClick={handleBulkSubmit} 
                disabled={!selectedSemester || isSubmitting}
                className={styles.button}
                style={{ marginTop: '0.5rem' }}
              >
                {isSubmitting ? 'Uploading...' : 'Process Upload'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <form action={async (formData) => {
          setIsSubmitting(true)
          const result = await addStudentAndParent(formData)
          setIsSubmitting(false)
          if (result.error) alert(result.error)
          else router.refresh()
        }} className={styles.form}>
          <div className={styles.gridForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="student_name">Student Full Name</label>
              <input id="student_name" name="student_name" type="text" placeholder="e.g. John Doe" required />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="roll_no">Roll Number / Register Number</label>
              <input id="roll_no" name="roll_no" type="text" placeholder="e.g. CS24001" required />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="semester_id">Semester & Department</label>
              <select id="semester_id" name="semester_id" required className={styles.select}>
                <option value="">Select a Semester...</option>
                {semesters?.map((sem: any) => (
                  <option key={sem.id} value={`${sem.id}_${sem.department_id}`}>
                    {sem.departments?.name} - {sem.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="parent_email">Parent Email (Optional)</label>
              <input id="parent_email" name="parent_email" type="email" placeholder="e.g. parent@example.com" />
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                If this email is not linked to a user, a new account will be created with password 'Meams@123'.
              </p>
            </div>
          </div>
          
          <button type="submit" disabled={isSubmitting} className={styles.button}>
            {isSubmitting ? 'Adding...' : 'Add Student & Parent'}
          </button>
        </form>
      )}
    </div>
  )
}
