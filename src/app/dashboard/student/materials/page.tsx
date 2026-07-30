import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import styles from '../../page.module.css'

export default async function StudentMaterialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  
  // Find all students for this parent
  const { data: students } = await adminClient
    .from('students')
    .select('id, name, roll_no, semester_id')
    .eq('parent_id', user.id)

  const semesterIds = students?.map(s => s.semester_id) || []
  
  let materials: any[] = []
  if (semesterIds.length > 0) {
    const { data: fetchMaterials } = await adminClient
      .from('study_materials')
      .select('id, title, content, file_url, created_at, subjects(name)')
      .in('semester_id', semesterIds)
      .order('id', { ascending: false })
      
    materials = fetchMaterials || []
  }

  return (
    <div className={styles.container}>
      <Link href="/dashboard" style={{ color: 'var(--accent)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        &larr; Back to Dashboard
      </Link>
      <div className={styles.dashboardSection}>
        <h2 className={styles.sectionTitle}>Study Materials</h2>
        <div className={styles.fullWidthCard}>
          <ul className={styles.list}>
            {materials.map(mat => (
              <li key={mat.id} className={styles.listItem} style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <span className={styles.itemTitle}>{mat.title}</span>
                  <div className={styles.itemSubtitle}>
                    {mat.subjects?.name} • Posted: {new Date(mat.created_at).toLocaleDateString()}
                  </div>
                  {mat.content && <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{mat.content}</p>}
                </div>
                {mat.file_url && (
                  <a href={mat.file_url} target="_blank" rel="noopener noreferrer" className={styles.actionButton} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', marginLeft: '1rem' }}>
                    View Link
                  </a>
                )}
              </li>
            ))}
            {materials.length === 0 && (
              <p className={styles.itemSubtitle}>No study materials found for the current batches.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
