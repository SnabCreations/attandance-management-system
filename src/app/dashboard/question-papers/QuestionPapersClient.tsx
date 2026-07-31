'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { Upload, Download, ExternalLink, Search } from 'lucide-react'
import styles from './question-papers.module.css'
import { bulkUploadQuestionPapers } from './actions'

export default function QuestionPapersClient({ initialPapers, departments, subjects, semesters, isFacultyOrAdmin }: { initialPapers: any[], departments: any[], subjects: any[], semesters: any[], isFacultyOrAdmin: boolean }) {
  const [papers, setPapers] = useState(initialPapers)
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [newPaper, setNewPaper] = useState({ title: '', drive_link: '', department_id: '', semester_id: '', subject_id: '' })

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[]
        const formattedData = []
        
        for (const row of rows) {
          if (row.title && row.drive_link && row.subject_id && row.semester_id) {
            formattedData.push({
              title: row.title,
              drive_link: row.drive_link,
              subject_id: row.subject_id,
              semester_id: row.semester_id
            })
          }
        }

        if (formattedData.length > 0) {
          const result = await bulkUploadQuestionPapers(formattedData)
          if (result.success) {
            alert(`Successfully uploaded ${formattedData.length} question papers! Please refresh to see them.`)
          } else {
            alert(`Error uploading papers: ${result.error}`)
          }
        } else {
          alert('No valid rows found. Please check your CSV format.')
        }
        setIsUploading(false)
      }
    })
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPaper.title || !newPaper.drive_link || !newPaper.subject_id || !newPaper.semester_id) return
    setIsUploading(true)
    const result = await bulkUploadQuestionPapers([newPaper])
    if (result.success) {
      alert('Question paper added successfully! Please refresh to see it.')
      setNewPaper({ title: '', drive_link: '', department_id: '', semester_id: '', subject_id: '' })
      setShowManualForm(false)
    } else {
      alert(`Error adding paper: ${result.error}`)
    }
    setIsUploading(false)
  }

  const downloadSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,title,drive_link,subject_id,semester_id\nMidterm 2025,https://drive.google.com/...,1,1\n"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "sample_question_papers.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredPapers = papers.filter(p => {
    // Note: If the actual row doesn't store department name, we just filter by what's available
    const matchesSubject = subjectFilter ? p.subjects?.name === subjectFilter : true
    const matchesSemester = semesterFilter ? p.semesters?.name === semesterFilter : true
    const matchesSearch = searchQuery ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
    return matchesSubject && matchesSemester && matchesSearch
  })

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Question Papers Repository</h2>
        
        {isFacultyOrAdmin && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <label className={styles.uploadBtn}>
              <Upload size={16} /> {isUploading ? 'Uploading...' : 'Bulk Upload (CSV)'}
              <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSVUpload} disabled={isUploading} />
            </label>
            <button type="button" onClick={downloadSampleCSV} className={styles.downloadBtn}>
              <Download size={16} /> Sample CSV
            </button>
            <button 
              type="button" 
              onClick={() => setShowManualForm(!showManualForm)} 
              className={styles.button}
              style={{ backgroundColor: showManualForm ? '#6b7280' : 'var(--brand-primary)' }}
            >
              {showManualForm ? 'Cancel' : 'Add Manually'}
            </button>
          </div>
        )}

        {showManualForm && (
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--bg-canvas)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div className={styles.inputGroup} style={{ flex: '1 1 200px' }}>
              <label>Title</label>
              <input type="text" required className={styles.input} value={newPaper.title} onChange={e => setNewPaper({...newPaper, title: e.target.value})} placeholder="e.g. Midterm 2025" />
            </div>
            <div className={styles.inputGroup} style={{ flex: '1 1 200px' }}>
              <label>Drive Link</label>
              <input type="url" required className={styles.input} value={newPaper.drive_link} onChange={e => setNewPaper({...newPaper, drive_link: e.target.value})} placeholder="https://..." />
            </div>
            <div className={styles.inputGroup} style={{ flex: '1 1 150px' }}>
              <label>Department</label>
              <select className={styles.select} value={newPaper.department_id} onChange={e => setNewPaper({...newPaper, department_id: e.target.value, semester_id: '', subject_id: ''})}>
                <option value="">Select...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className={styles.inputGroup} style={{ flex: '1 1 150px' }}>
              <label>Semester</label>
              <select required className={styles.select} value={newPaper.semester_id} onChange={e => setNewPaper({...newPaper, semester_id: e.target.value, subject_id: ''})} disabled={!newPaper.department_id}>
                <option value="">Select...</option>
                {semesters.filter(s => s.department_id.toString() === newPaper.department_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className={styles.inputGroup} style={{ flex: '1 1 150px' }}>
              <label>Subject</label>
              <select required className={styles.select} value={newPaper.subject_id} onChange={e => setNewPaper({...newPaper, subject_id: e.target.value})} disabled={!newPaper.semester_id}>
                <option value="">Select...</option>
                {subjects.filter(s => s.semester_id.toString() === newPaper.semester_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" disabled={isUploading} className={styles.button}>
                {isUploading ? 'Saving...' : 'Save Paper'}
              </button>
            </div>
          </form>
        )}

        <div className={styles.filters}>
          <div className={styles.inputGroup}>
            <label>Search Title</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="e.g. Midterm 2025"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className={styles.inputGroup}>
            <label>Filter by Department</label>
            <select className={styles.select} value={departmentFilter} onChange={(e) => {
              setDepartmentFilter(e.target.value)
              setSemesterFilter('')
              setSubjectFilter('')
            }}>
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Filter by Semester</label>
            <select className={styles.select} value={semesterFilter} onChange={(e) => {
              setSemesterFilter(e.target.value)
              setSubjectFilter('')
            }} disabled={!departmentFilter}>
              <option value="">All Semesters</option>
              {semesters.filter(s => departmentFilter ? s.department_id.toString() === departmentFilter : true).map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Filter by Subject</label>
            <select className={styles.select} value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} disabled={!semesterFilter && departmentFilter !== ''}>
              <option value="">All Subjects</option>
              {subjects.filter(s => semesterFilter ? s.semester_id === semesters.find(sem => sem.name === semesterFilter)?.id : true).map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Semester</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {filteredPapers.map(paper => (
                <tr key={paper.id}>
                  <td style={{ fontWeight: 500 }}>{paper.title}</td>
                  <td>{paper.subjects?.name}</td>
                  <td>{paper.semesters?.name}</td>
                  <td>
                    <a href={paper.drive_link} target="_blank" rel="noopener noreferrer" className={styles.link} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <ExternalLink size={14} /> Open
                    </a>
                  </td>
                </tr>
              ))}
              {filteredPapers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No question papers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
