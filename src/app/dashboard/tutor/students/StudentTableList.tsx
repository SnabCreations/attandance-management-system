'use client'

import { useState } from 'react'
import styles from './students.module.css'
import { deleteStudent, resetParentPassword, resetStudentPassword, editStudent } from './actions'

export default function StudentTableList({ students, isAdmin }: { students: any[], isAdmin: boolean }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  
  if (!students || students.length === 0) {
    return <p className={styles.emptyState}>No students registered yet.</p>
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Name</th>
            <th>Department / Semester</th>
            <th>Parent Linked</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {students.map((student: any) => {
            const isEditing = editingId === student.id
            
            if (isEditing) {
              return (
                <tr key={student.id}>
                  <td colSpan={isAdmin ? 5 : 4}>
                    <form 
                      style={{ display: 'flex', gap: '1rem', padding: '0.5rem', background: 'var(--bg-surface)' }}
                      action={async (formData) => {
                        await editStudent(formData)
                        setEditingId(null)
                      }}
                    >
                      <input type="hidden" name="id" value={student.id} />
                      <input type="text" name="roll_no" defaultValue={student.roll_no} className={styles.input} style={{ width: '100px' }} required />
                      <input type="text" name="name" defaultValue={student.name} className={styles.input} required />
                      <div style={{ flex: 1 }}></div>
                      <button type="submit" className={styles.button} style={{ padding: '0.25rem 0.75rem', height: 'fit-content' }}>Save</button>
                      <button type="button" onClick={() => setEditingId(null)} style={{ padding: '0.25rem 0.75rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', height: 'fit-content' }}>Cancel</button>
                    </form>
                  </td>
                </tr>
              )
            }
            
            return (
              <tr key={student.id}>
                <td className={styles.rollNo}>{student.roll_no}</td>
                <td className={styles.studentName}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {student.parent?.avatar_url ? (
                      <img src={student.parent.avatar_url} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                    )}
                    <span>{student.name}</span>
                  </div>
                </td>
                <td>
                  <span className={styles.badge}>
                    {student.semesters?.departments?.name} / {student.semesters?.name}
                  </span>
                </td>
                <td>
                  {student.parent_id ? (
                    <span className={styles.statusLinked}>Yes</span>
                  ) : (
                    <span className={styles.statusPending}>Pending</span>
                  )}
                </td>
                {isAdmin && (
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => setEditingId(student.id)} 
                        style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-canvas)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Edit
                      </button>
                      {student.user_id && (
                        <button 
                          onClick={async () => {
                            if (confirm('Reset student password to ams@carmel123?')) {
                              await resetStudentPassword(student.user_id)
                              alert('Student password reset.')
                            }
                          }}
                          style={{ padding: '0.25rem 0.5rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          Reset Pass
                        </button>
                      )}
                      <form action={async () => {
                        if (confirm('Are you sure you want to delete this student?')) {
                          await deleteStudent(student.id)
                        }
                      }}>
                        <button type="submit" className={styles.deleteBtn} style={{ padding: '0.25rem 0.5rem' }}>
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
