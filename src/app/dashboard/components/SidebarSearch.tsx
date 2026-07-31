'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

export default function SidebarSearch() {
  const [query, setQuery] = useState('')

  useEffect(() => {
    // Find all nav links and sections in the sidebar
    const links = document.querySelectorAll('nav a') as NodeListOf<HTMLAnchorElement>
    const sections = document.querySelectorAll('nav div') as NodeListOf<HTMLDivElement>

    if (query.trim() === '') {
      // Show everything
      links.forEach(link => link.style.display = 'block')
      sections.forEach(sec => sec.style.display = 'block')
      return
    }

    const lowerQuery = query.toLowerCase()

    // Filter links
    links.forEach(link => {
      if (link.textContent?.toLowerCase().includes(lowerQuery)) {
        link.style.display = 'block'
      } else {
        link.style.display = 'none'
      }
    })

    // Hide sections that have no visible links right after them
    // (A simple heuristic: just hide sections entirely during search to keep it clean,
    // or keep them if they match. Let's just hide sections when searching to avoid empty headers)
    sections.forEach(sec => {
      sec.style.display = 'none'
    })

  }, [query])

  return (
    <div style={{ padding: '0 1rem 1rem 1rem', position: 'relative' }}>
      <Search 
        size={16} 
        style={{ 
          position: 'absolute', 
          left: '1.75rem', 
          top: '50%', 
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)'
        }} 
      />
      <input
        type="text"
        placeholder="Quick search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '0.6rem 0.6rem 0.6rem 2.25rem',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          color: '#f8fafc',
          fontSize: '0.875rem',
          outline: 'none'
        }}
      />
    </div>
  )
}
