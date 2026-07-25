'use client'

import styles from './users.module.css'

export default function DeleteButton({ email }: { email: string }) {
  return (
    <button 
      type="submit" 
      className={styles.deleteButton}
      onClick={(e) => {
        if (!confirm(`Are you sure you want to permanently delete ${email}?`)) {
          e.preventDefault()
        }
      }}
    >
      Delete
    </button>
  )
}
