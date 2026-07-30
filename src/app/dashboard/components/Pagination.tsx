import React from 'react'
import Link from 'next/link'

export default function Pagination({ totalPages, currentPage, basePath = '?' }: { totalPages: number, currentPage: number, basePath?: string }) {
  if (totalPages <= 1) return null

  // Ensure basePath has ? or &
  const separator = basePath.includes('?') ? '&' : '?'

  return (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem', padding: '1rem' }}>
      {Array.from({ length: totalPages }).map((_, i) => (
        <Link key={i} href={`${basePath}${basePath === '?' ? '' : separator}page=${i + 1}`} style={{
          padding: '0.5rem 1rem', 
          border: '1px solid var(--border-color)', 
          borderRadius: 'var(--radius-md)',
          background: currentPage === i + 1 ? 'var(--accent)' : 'var(--bg-surface)',
          color: currentPage === i + 1 ? 'white' : 'var(--text-primary)',
          textDecoration: 'none',
          fontWeight: 600,
          transition: 'all 0.2s'
        }}>
          {i + 1}
        </Link>
      ))}
    </div>
  )
}
