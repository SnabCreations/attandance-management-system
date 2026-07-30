import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import styles from './tests.module.css'
import { createTest } from './actions'

export default async function TestsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  // Fetch all tests created by this faculty
  const { data: tests } = await adminClient
    .from('tests')
    .select('*, subjects(name)')
    .eq('created_by', user.id)
    .order('test_date', { ascending: false })

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Create New Test</h2>
        
        {assignments && assignments.length > 0 ? (
          <form action={createTest} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="title">Test Title</label>
              <input type="text" id="title" name="title" required placeholder="e.g. Midterm Exam" className={styles.input} />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="description">Description (Optional)</label>
              <textarea id="description" name="description" placeholder="Instructions..." className={styles.textarea} rows={3}></textarea>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="subject_id">Subject</label>
              <select id="subject_id" name="subject_id" required className={styles.select}>
                <option value="">Select Subject...</option>
                {assignments.map((a: any) => (
                  <option key={a.subject_id} value={a.subject_id}>
                    {a.subjects?.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.gridForm}>
              <div className={styles.inputGroup}>
                <label htmlFor="test_date">Test Date</label>
                <input type="date" id="test_date" name="test_date" required className={styles.input} />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="max_marks">Maximum Marks</label>
                <input type="number" id="max_marks" name="max_marks" required className={styles.input} defaultValue="100" />
              </div>
            </div>

            <button type="submit" className={styles.button}>Create Test</button>
          </form>
        ) : (
          <p className={styles.emptyState}>You have no subjects assigned to you to create tests.</p>
        )}
      </div>

      <div className={styles.card}>
        <h2>Your Tests</h2>
        {tests && tests.length > 0 ? (
          <div className={styles.assignmentGrid}>
            {tests.map((test: any) => (
              <div key={test.id} className={styles.assignmentCard}>
                <div className={styles.assignmentHeader}>
                  <h3 className={styles.assignmentTitle}>{test.title}</h3>
                  <span className={styles.badge}>{test.subjects?.name}</span>
                </div>
                <div className={styles.assignmentFooter}>
                  <span className={styles.date}>Date: {new Date(test.test_date).toLocaleDateString()}</span>
                  <Link href={`/dashboard/faculty/tests/${test.id}`} className={styles.gradeLink}>
                    Manage / Grade &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>You haven't created any tests yet.</p>
        )}
      </div>
    </div>
  )
}
