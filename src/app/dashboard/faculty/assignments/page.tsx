import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import styles from './assignments.module.css'
import { createAssignment } from './actions'

export default async function AssignmentsPage() {
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

  const subjectIds = assignments?.map(a => a.subject_id) || []

  // Fetch all assignments created for these subjects
  let createdAssignments: any = []
  if (subjectIds.length > 0) {
    const { data } = await adminClient
      .from('assignments')
      .select('*, subjects(name)')
      .in('subject_id', subjectIds)
      .order('id', { ascending: false })
      
    createdAssignments = data || []
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Create New Assignment</h2>
        
        {assignments && assignments.length > 0 ? (
          <form action={createAssignment} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="title">Assignment Title</label>
              <input type="text" id="title" name="title" required className={styles.input} />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="description">Description (Optional)</label>
              <textarea id="description" name="description" rows={3} className={styles.textarea}></textarea>
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
                <label htmlFor="due_date">Due Date</label>
                <input type="date" id="due_date" name="due_date" required className={styles.input} />
              </div>
            </div>

            <button type="submit" className={styles.button}>Create Assignment</button>
          </form>
        ) : (
          <p className={styles.emptyState}>You have no subjects assigned to you to create assignments.</p>
        )}
      </div>

      <div className={styles.card}>
        <h2>Existing Assignments</h2>
        {createdAssignments.length > 0 ? (
          <div className={styles.assignmentGrid}>
            {createdAssignments.map((assignment: any) => (
              <div key={assignment.id} className={styles.assignmentCard}>
                <div className={styles.assignmentHeader}>
                  <h3>{assignment.title}</h3>
                  <span className={styles.badge}>{assignment.subjects?.name}</span>
                </div>
                <p className={styles.desc}>{assignment.description || 'No description provided.'}</p>
                <div className={styles.assignmentFooter}>
                  <span className={styles.dueDate}>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                  <Link href={`/dashboard/faculty/assignments/${assignment.id}`} className={styles.gradeLink}>
                    Grade Submissions &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>No assignments created yet.</p>
        )}
      </div>
    </div>
  )
}
