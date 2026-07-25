'use client'

import { useState } from 'react'
import { updateUserRoles } from './actions'
import styles from './users.module.css'

export default function EditUserModal({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rolesList = ['Admin', 'Tutor', 'Faculty', 'Parent']

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    
    const result = await updateUserRoles(formData)
    
    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    } else {
      setIsOpen(false)
      setIsPending(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className={styles.button}
        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--accent)' }}
        type="button"
      >
        Edit Roles
      </button>

      {isOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem', marginTop: 0 }}>Edit Roles: {user.email}</h3>
            
            <form action={handleSubmit} className={styles.form}>
              <input type="hidden" name="user_id" value={user.id} />
              
              <div className={styles.inputGroup}>
                <label>Assign Roles</label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {rolesList.map(role => (
                    <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal' }}>
                      <input 
                        type="checkbox" 
                        name="roles" 
                        value={role} 
                        defaultChecked={user.roles?.includes(role)}
                        style={{ width: 'auto' }}
                      />
                      {role}
                    </label>
                  ))}
                </div>
              </div>
              
              {error && <div className={styles.error}>{error}</div>}
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsOpen(false)} className={styles.button} style={{ backgroundColor: 'var(--muted)', flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className={styles.button} style={{ flex: 1 }}>
                  {isPending ? 'Saving...' : 'Save Roles'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
