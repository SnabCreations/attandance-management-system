'use client'

import { useFormStatus } from 'react-dom'
import styles from './login.module.css'

export function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className={styles.button}>
      {pending ? 'Logging in...' : 'Log In'}
    </button>
  )
}
