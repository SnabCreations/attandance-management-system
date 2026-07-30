import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import styles from './materials.module.css'
import { createMaterial, deleteMaterial } from './actions'

export default async function StudyMaterialsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminClient = createAdminClient()

  // Fetch subjects assigned to this faculty
  const { data: assignments } = await adminClient
    .from('faculty_subjects')
    .select(`
      subject_id,
      semester_id,
      subjects (name)
    `)
    .eq('faculty_id', user.id)

  const { data: materials } = await adminClient
    .from('study_materials')
    .select('*, subjects(name)')
    .eq('uploaded_by', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Study Materials</h1>
        <p className={styles.subtitle}>Upload and manage course materials for your students.</p>
      </div>

      <div className={styles.card}>
        <h2>Upload New Material</h2>
        {assignments && assignments.length > 0 ? (
          <form action={createMaterial} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="title">Title</label>
              <input type="text" id="title" name="title" required placeholder="e.g. Chapter 1 Notes" className={styles.input} />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="description">Description / Rich Text (Optional)</label>
              <textarea id="description" name="description" placeholder="Add some context or rich notes..." className={styles.textarea} rows={4}></textarea>
            </div>

            <div className={styles.gridForm}>
              <div className={styles.inputGroup}>
                <label htmlFor="subject_id">Subject</label>
                <select id="subject_id" name="subject_id" required className={styles.select}>
                  <option value="">Select a Subject...</option>
                  {assignments.map((a: any) => (
                    <option key={a.subject_id} value={a.subject_id}>
                      {a.subjects?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="type">Material Type</label>
                <select id="type" name="type" required className={styles.select}>
                  <option value="Document">Document / PDF</option>
                  <option value="Video">Video Link</option>
                  <option value="Link">External Link</option>
                </select>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="url">URL / Link to File</label>
              <input type="url" id="url" name="url" placeholder="https://example.com/file.pdf" className={styles.input} />
              <small style={{ color: 'var(--text-muted)' }}>Provide a link to Google Drive, YouTube, or direct PDF.</small>
            </div>

            <button type="submit" className={styles.button}>Upload Material</button>
          </form>
        ) : (
          <p className={styles.emptyState}>You have no subjects assigned to you.</p>
        )}
      </div>

      <div className={styles.card}>
        <h2>Your Uploaded Materials</h2>
        {materials && materials.length > 0 ? (
          <div className={styles.materialGrid}>
            {materials.map((mat: any) => (
              <div key={mat.id} className={styles.materialCard}>
                <div className={styles.materialHeader}>
                  <h3 className={styles.materialTitle}>{mat.title}</h3>
                  <span className={`${styles.badge} ${styles['badge' + mat.type]}`}>{mat.type}</span>
                </div>
                <span className={styles.subjectBadge}>{mat.subjects?.name}</span>
                <p className={styles.desc}>{mat.description}</p>
                <div className={styles.materialFooter}>
                  {mat.url && (
                    <a href={mat.url} target="_blank" rel="noopener noreferrer" className={styles.viewLink}>
                      View Resource &rarr;
                    </a>
                  )}
                  <form action={deleteMaterial}>
                    <input type="hidden" name="id" value={mat.id} />
                    <button type="submit" className={styles.deleteBtn}>Delete</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>You haven't uploaded any materials yet.</p>
        )}
      </div>
    </div>
  )
}
