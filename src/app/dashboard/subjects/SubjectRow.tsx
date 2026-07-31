'use client'

import { useState } from 'react'
import { Trash2, Edit2, X, Check } from 'lucide-react'
import { deleteSubject, editSubject } from './actions'
import styles from './subjects.module.css'

export default function SubjectRow({ sub }: { sub: any }) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(sub.name)
  const [code, setCode] = useState(sub.code || '')

  const handleSave = async () => {
    await editSubject(sub.id, name, code)
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleSave} style={{ padding: '0.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }} title="Save">
            <Check size={16} />
          </button>
          <button onClick={() => { setIsEditing(false); setName(sub.name); setCode(sub.code || ''); }} style={{ padding: '0.5rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }} title="Cancel">
            <X size={16} />
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className={styles.listItem}>
      <div className={styles.subInfo}>
        <span className={styles.subCode}>{sub.code || `SUB-${sub.id}`}</span>
        <span className={styles.subName}>{sub.name}</span>
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
