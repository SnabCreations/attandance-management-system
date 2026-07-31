'use client'

import { useState } from 'react'
import { resetUserPassword } from './actions'

export default function ResetPasswordButton({ userId, email }: { userId: string, email: string }) {
  const [resetState, setResetState] = useState<{ loading: boolean, password?: string }>({ loading: false })

  const handleReset = async () => {
    setResetState({ loading: true })
    const formData = new FormData()
    formData.append('user_id', userId)
    formData.append('email', email)
    
    const result = await resetUserPassword(formData)
    
    if (result && result.password) {
      setResetState({ loading: false, password: result.password })
    } else {
      setResetState({ loading: false })
      alert('Failed to reset password')
    }
  }

  if (resetState.password) {
    return (
      <span style={{ 
        padding: '0.375rem 0.75rem', 
        backgroundColor: '#10b981', 
        color: 'white', 
        border: '1px solid #059669', 
        borderRadius: '4px', 
        fontSize: '0.875rem',
        fontWeight: 600
      }}>
        Reset to: {resetState.password}
      </span>
    )
  }

  return (
    <button 
      onClick={handleReset}
      disabled={resetState.loading}
      style={{ 
        padding: '0.375rem 0.75rem', 
        backgroundColor: '#3b82f6', 
        color: 'white', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: resetState.loading ? 'not-allowed' : 'pointer', 
        fontSize: '0.875rem',
        opacity: resetState.loading ? 0.7 : 1
      }}
      title="Reset to default password"
    >
      {resetState.loading ? 'Resetting...' : 'Reset Password'}
    </button>
  )
}
