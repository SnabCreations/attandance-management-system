import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import styles from '../page.module.css'
import { addAnnouncement, deleteAnnouncement } from './actions'

export default async function AnnouncementsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userProfile } = await supabase.from('users').select('roles').eq('id', user.id).single()
  const roles = userProfile?.roles || []
  
  const isManager = roles.includes('Admin') || roles.includes('Faculty') || roles.includes('Tutor')

  const adminSupabase = createAdminClient()
  const { data: announcements } = await adminSupabase
    .from('announcements')
    .select('id, title, content, created_at, target_audience')
    .order('created_at', { ascending: false })

  let availableSemesters: any[] = []
  if (roles.includes('Admin')) {
    const { data } = await adminSupabase.from('semesters').select('id, name, departments(name)').order('department_id')
    availableSemesters = data || []
  } else if (roles.includes('Tutor') || roles.includes('Faculty')) {
    const semIds = new Set<number>()
    if (roles.includes('Tutor')) {
      const { data: tutorSems } = await adminSupabase.from('semester_tutors').select('semester_id').eq('tutor_id', user.id)
      tutorSems?.forEach(s => semIds.add(s.semester_id))
    }
    if (roles.includes('Faculty')) {
      const { data: facSems } = await adminSupabase.from('faculty_subjects').select('semester_id').eq('faculty_id', user.id)
      facSems?.forEach(s => semIds.add(s.semester_id))
    }
    if (semIds.size > 0) {
      const { data } = await adminSupabase.from('semesters').select('id, name, departments(name)').in('id', Array.from(semIds))
      availableSemesters = data || []
    }
  }

  return (
    <div className={styles.container}>
      {isManager && (
        <div className={styles.dashboardSection}>
          <h2 className={styles.sectionTitle}>Manage Announcements</h2>
          <form action={addAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="title" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Title</label>
              <input 
                id="title" 
                name="title" 
                type="text" 
                placeholder="E.g., Tomorrow's Holiday" 
                required 
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="content" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Content</label>
              <textarea 
                id="content" 
                name="content" 
                placeholder="Announcement details..." 
                rows={4}
                required 
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="target_audience" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Target Audience</label>
              <select 
                id="target_audience" 
                name="target_audience" 
                required 
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: 'white' }}
              >
                <option value="all">Public (Everyone / Landing Page)</option>
                {availableSemesters.map(sem => (
                  <option key={sem.id} value={`${sem.departments?.name} - ${sem.name}`}>
                    {sem.departments?.name} - {sem.name} (Private)
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" style={{ padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
              Post Announcement
            </button>
          </form>
        </div>
      )}

      <div className={styles.dashboardSection}>
        <h2 className={styles.sectionTitle}>Active Announcements</h2>
        {announcements && announcements.length > 0 ? (
          <ul className={styles.list}>
            {announcements.map((ann: any) => (
              <li key={ann.id} className={styles.listItem}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className={styles.itemTitle}>{ann.title}</span>
                    <span style={{ fontSize: '0.7rem', padding: '0.125rem 0.5rem', backgroundColor: ann.target_audience === 'all' ? '#dcfce7' : '#fee2e2', color: ann.target_audience === 'all' ? '#166534' : '#991b1b', borderRadius: '9999px', fontWeight: 600 }}>
                      {ann.target_audience === 'all' ? 'Public' : ann.target_audience + ' (Private)'}
                    </span>
                  </div>
                  <div className={styles.itemSubtitle}>{ann.content}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    Posted on {new Date(ann.created_at).toLocaleString()}
                  </div>
                </div>
                {(roles.includes('Admin') || roles.includes('Tutor') || roles.includes('Faculty')) && (
                  <form action={async () => {
                    'use server'
                    await deleteAnnouncement(ann.id)
                  }}>
                    <button type="submit" style={{ backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No announcements found.</p>
        )}
      </div>
    </div>
  )
}
