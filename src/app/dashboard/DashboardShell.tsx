'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import styles from './dashboard.module.css'

export default function DashboardShell({
  sidebarContent,
  children,
}: {
  sidebarContent: React.ReactNode
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className={styles.layout}>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className={styles.mobileOverlay} 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`} onClick={() => {
        // If clicking a link on mobile, close sidebar
        if (window.innerWidth <= 768) {
          setIsMobileMenuOpen(false)
        }
      }}>
        {sidebarContent}
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <button 
            className={styles.mobileMenuBtn} 
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <div className={styles.topbarTitle}>Dashboard</div>
        </header>
        <div className={styles.pageContent}>
          {children}
        </div>
      </main>
    </div>
  )
}
