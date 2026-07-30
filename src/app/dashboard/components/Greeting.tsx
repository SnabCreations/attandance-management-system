'use client'

import { useEffect, useState } from 'react'
import styles from '../page.module.css'

export default function Greeting({ name = '' }: { name?: string }) {
  const [greeting, setGreeting] = useState('Welcome')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good Morning')
    else if (hour < 18) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')
  }, [])

  return (
    <div className={styles.greetingContainer}>
      <h1 className={styles.greetingText}>{greeting}{name ? `, ${name}` : ''}</h1>
    </div>
  )
}
