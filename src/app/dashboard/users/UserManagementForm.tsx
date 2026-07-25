'use client'

import { useState } from 'react'
import { createUser } from './actions'
import styles from './users.module.css'

export default function UserManagementForm() {
  const [isPending, setIsPending] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [createdEmail, setCreatedEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    setGeneratedPassword(null)
    
    // Ensure at least one role is selected
    const roles = formData.getAll('roles')
    if (roles.length === 0) {
      setError('Please select at least one role.')
      setIsPending(false)
      return
    }

    const result = await createUser(formData)
    
    if (result.error) {
      setError(result.error)
    } else if (result.password && result.email) {
      setGeneratedPassword(result.password)
      setCreatedEmail(result.email)
      ;(document.getElementById('userForm') as HTMLFormElement).reset()
    }
    
    setIsPending(false)
  }

  function downloadCSV() {
    if (!createdEmail || !generatedPassword) return
    const csvContent = `data:text/csv;charset=utf-8,Email,Temporary Password\n${createdEmail},${generatedPassword}`
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `credentials_${createdEmail}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      {error && (
        <div className={styles.errorAlert}>
          {error}
        </div>
      )}

      {generatedPassword && (
        <div className={styles.successAlert}>
          <strong>Success!</strong> Account created for <span>{createdEmail}</span>.<br/>
          Their temporary password is: <code className={styles.tempPassword}>{generatedPassword}</code><br/><br/>
          <button onClick={downloadCSV} type="button" className={styles.button} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
            Download CSV
          </button>
        </div>
      )}

      <form id="userForm" action={handleSubmit} className={styles.form}>
        <div className={styles.gridForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="e.g. teacher@carmel.com" 
              required 
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label>Roles (Select all that apply)</label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input type="checkbox" name="roles" value="Admin" /> Admin
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input type="checkbox" name="roles" value="Tutor" /> Tutor
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input type="checkbox" name="roles" value="Faculty" /> Faculty
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input type="checkbox" name="roles" value="Parent" /> Parent
              </label>
            </div>
          </div>
        </div>
        
        <button type="submit" disabled={isPending} className={styles.button}>
          {isPending ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}
