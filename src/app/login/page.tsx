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
            src="https://carmelpoly.in/_next/image?url=%2Fmainlogo.png&w=2048&q=75" 
            alt="Carmel Logo" 
            className={styles.logoImg}
          />
          <img 
            src="/meams-logo.webp"
            alt="MEAMS Logo"
            className={styles.logoImg}
          />
        </div>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Academic Management System</p>
        
        <form action={login} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="you@example.com" 
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
        <p>
          &copy; {new Date().getFullYear()} Carmel Polytechnic College. MEAMS. All rights reserved.<br/>
          <span>
            Developed & Crafted by <strong>Snab Creations</strong>
          </span>
        </p>
      </div>
    </div>
  )
}
