'use client'

import styles from './hours.module.css'

export default function HoursFilter({ semesters, currentSemesterId }: { semesters: any[], currentSemesterId: string }) {
  return (
    <form method="GET" style={{ marginTop: '1rem' }}>
      <select 
        name="semester_id" 
        className={styles.select} 
        defaultValue={currentSemesterId}
        onChange={(e) => e.target.form?.submit()}
        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-canvas)', color: 'var(--text-primary)' }}
      >
        <option value="">Common Hours (Global)</option>
        {semesters?.map((sem: any) => (
          <option key={sem.id} value={sem.id}>{sem.name}</option>
        ))}
      </select>
    </form>
  )
}
