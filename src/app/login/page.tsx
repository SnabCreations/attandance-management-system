/**
 * Developed and Crafted by Snab Creations
 * Author: @Abdulkhadhar (GitHub)
 * Copyright (c) 2026 Carmel Polytechnic College. All rights reserved.
 * 
 * This code is proprietary and may not be copied, distributed, or modified
 * without express written permission.
 */
import Link from 'next/link'
import { login } from './actions'
import styles from './login.module.css'
import { SubmitButton } from './SubmitButton'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const resolvedParams = await searchParams;
  
  return (
    <div className={styles.container}>
      <div className={styles.backButtonContainer}>
        <Link href="/" className={styles.backButton}>
          ← Back to Home
        </Link>
      </div>
      <div className={styles.card}>
        <div className={styles.logosContainer}>
          <img 
            src="/meams-logo-text.webp"
            alt="Carmel MEAMS Logo"
            className={styles.logoImg}
            style={{ width: '180px', height: 'auto', marginBottom: '1rem' }}
          />
        </div>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Academic Management System</p>
        
        <form action={login} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address or Username</label>
            <input 
              id="email" 
              name="email" 
              type="text" 
              placeholder="you@example.com or username@dept26" 
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              required 
            />
          </div>

          {resolvedParams?.error && (
            <p className={styles.error}>{resolvedParams.error}</p>
          )}

          <SubmitButton />
        </form>
      </div>
      <div className={styles.footer}>
        <p style={{ lineHeight: '1.6', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
          &copy; 2026 Carmel MEAMS. All Rights Reserved.<br />
          A Product of <a href="https://carmelpoly.in" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Carmel Polytechnic College</a>.<br/>
          <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', display: 'inline-block', opacity: 0.9 }}>
            Designed & Developed by <a href="https://www.snabcreations.com" target="_blank" rel="noopener noreferrer" className="hover:underline"><strong>Snab Creations</strong></a>
          </span>
        </p>
      </div>
    </div>
  )
}
