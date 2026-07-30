import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import styles from '../assignments.module.css'
import GradeForm from './GradeForm'

export default async function AssignmentDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminClient = createAdminClient()

  // 1. Fetch the Assignment details
  const { data: assignment } = await adminClient
    .from('assignments')
    .select('*, subjects(name)')
    .eq('id', params.id)
    .single()

  if (!assignment) {
    return <div className={styles.container}>Assignment not found.</div>
  }

  // 2. Fetch all student submissions for this assignment
  const { data: submissions } = await adminClient
    .from('student_assignments')
    .select(`
      id,
      status,
      marks,
      students (id, name, roll_no)
    `)
    .eq('assignment_id', params.id)
    .order('students(roll_no)')

  return (
    <div className={styles.container}>
      <Link href="/dashboard/faculty/assignments" className={styles.backLink}>
        &larr; Back to Assignments
      </Link>
      
      <div className={styles.card}>
        <div className={styles.assignmentHeader}>
          <h2>{assignment.title}</h2>
          <span className={styles.badge}>{assignment.subjects?.name}</span>
        </div>
        <p className={styles.desc}>{assignment.description}</p>
        <p className={styles.dueDate}>Due Date: {new Date(assignment.due_date).toLocaleDateString()}</p>
      </div>

      <div className={styles.card}>
        <h2>Grade Submissions</h2>
        {submissions && submissions.length > 0 ? (
          <GradeForm submissions={submissions} assignmentId={params.id} />
        ) : (
          <p className={styles.emptyState}>No students found for this assignment's batch.</p>
        )}
      </div>
    </div>
  )
}
