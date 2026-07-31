/**
 * Developed and Crafted by Snab Creations
 * Author: @Abdulkhadhar (GitHub)
 * Copyright (c) 2026 Carmel Polytechnic College. All rights reserved.
 * 
 * This code is proprietary and may not be copied, distributed, or modified
 * without express written permission.
 */
import Link from "next/link";
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import styles from './landing.module.css'

export default async function LandingPage() {
  const supabase = await createClient()
  
  const adminSupabase = createAdminClient()
  const { data: announcements } = await adminSupabase
    .from('announcements')
    .select('title, content, created_at')
    .eq('target_audience', 'all')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className={styles.pageContainer}>
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navLogo}>
          <img 
            src="/meams-logo-text.webp"
            alt="Carmel MEAMS Logo"
            style={{ height: '40px', width: 'auto' }}
          />
        </div>
        <div>
          <Link href="/login" className={styles.loginBtn}>
            Login to Portal
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className={styles.mainContent}>
        <div className={styles.heroGrid}>
          <div className={styles.heroLeft}>
            <div className={styles.heroLogoContainer}>
              <img 
                src="/meams-logo-text.webp"
                alt="Carmel MEAMS Logo"
                style={{ height: '120px', width: 'auto' }}
              />
            </div>
            
            <h1 className={styles.heroTitle}>
              Carmel <span className={styles.highlightText}>MEAMS</span>
            </h1>
            
            <p className={styles.heroSubtitle}>
              Mechanical Engineering Attendance Management System
            </p>

            <p className={styles.heroDescription}>
              A secure, role-based platform designed specifically for the Mechanical Engineering department to streamline attendance tracking, assignment grading, and academic oversight.
            </p>
            
            <Link href="/login" className={styles.ctaBtn}>
              Login
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>

          {/* Announcements Sidebar */}
          {announcements && announcements.length > 0 && (
            <div className={styles.heroRight}>
              <div className={styles.announcementPanel}>
                <div className={styles.announcementHeader}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  Public Announcements
                </div>
                <div className={styles.announcementScrollArea}>
                  <div className={styles.announcementList}>
                    {[...announcements, ...announcements].map((ann, idx) => {
                      const isNew = new Date().getTime() - new Date(ann.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
                      return (
                        <div key={idx} className={styles.announcementCard}>
                          <div className={styles.announcementCardHeader}>
                            <h4 className={styles.announcementCardTitle}>{ann.title}</h4>
                            {isNew && <span className={styles.newBadge}>New</span>}
                          </div>
                          <p className={styles.announcementCardBody}>{ann.content}</p>
                          <span className={styles.announcementCardDate}>
                            {new Date(ann.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.iconBlue}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3 className={styles.featureTitle}>Role-Based Access</h3>
            <p className={styles.featureDesc}>Dedicated dashboards for Admins, Faculty, Tutors, and Parents. You only see what matters to you.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.iconEmerald}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3 className={styles.featureTitle}>Hourly Attendance</h3>
            <p className={styles.featureDesc}>Mark absentees on an hourly basis with a highly optimized interface connected directly to the timetable.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.iconPurple}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
            </div>
            <h3 className={styles.featureTitle}>Timetable Integration</h3>
            <p className={styles.featureDesc}>Live timetable and assignment updates syncing from Faculty down to Parent dashboards instantly.</p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className={styles.footer}>
        <p style={{ lineHeight: '1.6' }}>
          &copy; 2026 Carmel MEAMS. All Rights Reserved.<br />
          A Product of <a href="https://carmelpoly.in" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Carmel Polytechnic College</a>.<br/>
          <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', display: 'inline-block', opacity: 0.8 }}>
            Designed & Developed by <strong>Snab Creations</strong>
          </span>
        </p>
      </footer>
    </div>
  );
}
