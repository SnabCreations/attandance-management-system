'use client'

import { useState } from 'react'
import { Trash2, Edit2, X, Check } from 'lucide-react'
import { deleteSubject, editSubject } from './actions'
import styles from './subjects.module.css'

export default function SubjectRow({ sub, facultyMembers, assignedFacultyId }: { sub: any, facultyMembers?: any[], assignedFacultyId?: string }) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(sub.name)
  const [code, setCode] = useState(sub.code || '')
  const [faculty, setFaculty] = useState(assignedFacultyId || '')

  const handleSave = async () => {
    await editSubject(sub.id, name, code, faculty || null)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <li className={styles.listItem} style={{ gap: '1rem', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          value={code} 
          onChange={e => setCode(e.target.value)} 
          className={styles.select}
          style={{ width: '120px' }}
          placeholder="Code"
        />
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className={styles.select}
          style={{ flex: 1 }}
          placeholder="Name"
        />
        <select
          value={faculty}
          onChange={e => setFaculty(e.target.value)}
          className={styles.select}
          style={{ width: '200px' }}
        >
          <option value="">No Faculty Assigned</option>
          {facultyMembers?.map(f => (
            <option key={f.id} value={f.id}>{f.email}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleSave} style={{ padding: '0.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }} title="Save">
            <Check size={16} />
          </button>
          <button onClick={() => { setIsEditing(false); setName(sub.name); setCode(sub.code || ''); setFaculty(assignedFacultyId || ''); }} style={{ padding: '0.5rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }} title="Cancel">
            <X size={16} />
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className={styles.listItem}>
      <div className={styles.subInfo} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className={styles.subCode}>{sub.code || `SUB-${sub.id}`}</span>
          <span className={styles.subName}>{sub.name}</span>
        </div>
        <div style={{ fontSize: '0.875rem', color: '#64748b', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
          {assignedFacultyId ? (
            <span>Assigned to: <strong>{facultyMembers?.find(f => f.id === assignedFacultyId)?.email}</strong></span>
          ) : (
            <span style={{ fontStyle: 'italic' }}>Unassigned</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Edit">
          <Edit2 size={16} />
        </button>
        <button onClick={async () => {
          if (confirm('Are you sure you want to delete this subject?')) {
            await deleteSubject(sub.id)
          }
        }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Delete">
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  )
}
