'use client'

import { useState } from 'react'
import { resetPassword } from './actions'
import styles from './reset.module.css'

export default function ResetPasswordForm() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    
    const result = await resetPassword(formData)
    
    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
    // On success, the server action will redirect
  }

  return (
    <form action={handleSubmit} className={styles.form}>
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.inputGroup}>
        <label htmlFor="password">New Password</label>
        <input 
          id="password" 
          name="password" 
          type="password" 
          required 
          minLength={6}
          placeholder="Enter new password"
        />
      </div>
      
      <div className={styles.inputGroup}>
        <label htmlFor="confirm">Confirm Password</label>
        <input 
          id="confirm" 
          name="confirm" 
          type="password" 
          required 
          minLength={6}
          placeholder="Confirm new password"
        />
      </div>
      
      <button type="submit" disabled={isPending} className={styles.button}>
        {isPending ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  )
}
