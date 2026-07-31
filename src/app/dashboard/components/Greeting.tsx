'use client'

import { useEffect, useState } from 'react'
import styles from '../page.module.css'

export default function Greeting({ role = 'User' }: { role?: string }) {
  const [greeting, setGreeting] = useState('Welcome')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good Morning')
    else if (hour < 18) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')
  }, [])

  return (
    <div className={styles.greetingContainer} style={{ marginBottom: '2rem' }}>
      <h1 className={styles.greetingText} style={{ fontSize: '1.75rem', fontWeight: '700' }}>
        {greeting}, {role} 👋
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Welcome back! Here's today's overview.</p>
    </div>
  )
}
