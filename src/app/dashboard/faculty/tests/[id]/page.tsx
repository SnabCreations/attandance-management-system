import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import styles from '../tests.module.css'
import SpreadsheetGradeForm from './SpreadsheetGradeForm'

export default async function TestDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // 1. Fetch the Test details
  const { data: test } = await supabase
    .from('tests')
    .select('*, subjects(name)')
    .eq('id', params.id)
    .single()

  if (!test) {
    return <div className={styles.container}>Test not found.</div>
  }

  // 2. Fetch all student tests for this test
  const { data: submissions } = await supabase
    .from('student_tests')
    .select(`
      id,
      status,
      marks_obtained,
      students (id, name, roll_no)
    `)
    .eq('test_id', params.id)
    .order('students(roll_no)')

  return (
    <div className={styles.container}>
      <Link href="/dashboard/faculty/tests" className={styles.backLink}>
        &larr; Back to Tests
      </Link>
      
      <div className={styles.card}>
        <div className={styles.assignmentHeader}>
          <h2>{test.title}</h2>
          <span className={styles.badge}>{test.subjects?.name}</span>
        </div>
        <p className={styles.desc}>{test.description}</p>
        <p className={styles.dueDate}>Test Date: {new Date(test.test_date).toLocaleDateString()} | Max Marks: {test.max_marks}</p>
      </div>

      <div className={styles.card}>
        <h2>Grade Tests (Spreadsheet View)</h2>
        <p className={styles.helpText}>Enter marks directly into the rows. The data saves automatically when you click the Submit Grades button.</p>
        {submissions && submissions.length > 0 ? (
          <SpreadsheetGradeForm submissions={submissions} testId={params.id} maxMarks={test.max_marks} />
        ) : (
          <p className={styles.emptyState}>No students found for this test's batch.</p>
        )}
      </div>
    </div>
  )
}
