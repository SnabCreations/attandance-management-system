'use client'

import { useState } from 'react'
import styles from './semesters.module.css'
import { deleteSemester, editSemester } from './actions'

export default function SemesterList({ semesters, tutors }: { semesters: any[], tutors: any[] }) {
  const [editingId, setEditingId] = useState<number | null>(null)
  
  if (!semesters || semesters.length === 0) {
    return <p className={styles.emptyState}>No semesters found. Add one above!</p>
  }

  return (
    <ul className={styles.list}>
      {semesters.map((sem: any) => {
        const isEditing = editingId === sem.id
        
        return (
          <li key={sem.id} className={styles.listItem}>
            {isEditing ? (
              <form 
                className={styles.semInfo} 
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                action={async (formData) => {
                  await editSemester(formData)
                  setEditingId(null)
                }}
              >
                <input type="hidden" name="id" value={sem.id} />
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <select name="name" defaultValue={sem.name} className={styles.select} required>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={`Semester ${num}`}>Semester {num}</option>
                    ))}
                  </select>
                  <span className={styles.deptBadge}>{sem.departments?.name}</span>
                </div>
                
                <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ gridColumn: '1 / -1', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>Assign Tutors</div>
                  {tutors?.map((tutor) => {
                    const isAssigned = sem.semester_tutors?.some((st: any) => st.tutor_id === tutor.id)
                    return (
                      <label key={tutor.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input type="checkbox" name="tutor_id" value={tutor.id} defaultChecked={isAssigned} />
                        {tutor.email}
                      </label>
                    )
                  })}
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className={styles.button} style={{ padding: '0.5rem 1rem' }}>Save</button>
                  <button type="button" onClick={() => setEditingId(null)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className={styles.semInfo}>
                  <span className={styles.semName}>{sem.name}</span>
                  <span className={styles.deptBadge}>{sem.departments?.name}</span>
                  {sem.semester_tutors && sem.semester_tutors.length > 0 && (
                    <span className={styles.deptBadge} style={{ backgroundColor: 'var(--accent)', marginLeft: '0.5rem' }}>
                      Tutors: {sem.semester_tutors.map((st: any) => st.users?.email).filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span className={styles.semId} style={{ marginRight: '1rem' }}>ID: {sem.id}</span>
                  
                  <button 
                    type="button" 
                    onClick={() => setEditingId(sem.id)}
                    style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-canvas)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    Edit
                  </button>

                  <form action={async () => { await deleteSemester(sem.id) }}>
                    <button type="submit" style={{ padding: '0.25rem 0.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                      Delete
                    </button>
                  </form>
                </div>
              </>
            )}
          </li>
        )
      })}
    </ul>
  )
}
