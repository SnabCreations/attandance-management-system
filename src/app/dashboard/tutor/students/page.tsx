import { createClient } from '@/utils/supabase/server'
import styles from './students.module.css'
import StudentRegistryForm from './StudentRegistryForm'
import { deleteStudent } from './actions'
import Pagination from '../../components/Pagination'

export default async function StudentRegistryPage(props: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || '1')
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userProfile } = await supabase.from('users').select('roles').eq('id', user.id).single()
  const isAdmin = userProfile?.roles?.includes('Admin')

  let semesterIds: number[] = []

  if (!isAdmin) {
    const { data: assignedSemesters } = await supabase
      .from('semester_tutors')
      .select('semester_id')
      .eq('tutor_id', user.id)
      
    semesterIds = assignedSemesters?.map(s => s.semester_id) || []
  }

  let semesterQuery = supabase
    .from('semesters')
    .select('id, name, department_id, departments(name)')
    .order('department_id')

  if (!isAdmin) {
    if (semesterIds.length === 0) {
      // Return empty if not assigned
      semesterQuery = semesterQuery.in('id', [0])
    } else {
      semesterQuery = semesterQuery.in('id', semesterIds)
    }
  }

  const { data: semesters } = await semesterQuery

  let studentsQuery = supabase
    .from('students')
    .select(`
      id,
      name,
      roll_no,
      semesters (name, departments(name)),
      parent_id
    `)
    .order('roll_no')

  if (!isAdmin && semesters && semesters.length > 0) {
    studentsQuery = studentsQuery.in('semester_id', semesters.map((s: any) => s.id))
  }

  const countQuery = supabase.from('students').select('*', { count: 'exact', head: true })
  if (!isAdmin && semesters && semesters.length > 0) {
    countQuery.in('semester_id', semesters.map((s: any) => s.id))
  }
  const { count: totalStudents } = await countQuery
  const totalPages = Math.ceil((totalStudents || 0) / pageSize)

  const { data: students } = await studentsQuery.range(from, to)

  if (!isAdmin && (!semesters || semesters.length === 0)) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Student Registry</h2>
          <p className={styles.emptyState}>You have not been assigned as a Tutor to any batch. Please contact the administrator.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <StudentRegistryForm semesters={semesters || []} />

      <div className={styles.card}>
        <h2>Student Registry</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Department / Semester</th>
                <th>Parent Linked</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {students?.map((student: any) => (
                <tr key={student.id}>
                  <td className={styles.rollNo}>{student.roll_no}</td>
                  <td className={styles.studentName}>{student.name}</td>
                  <td>
                    <span className={styles.badge}>
                      {student.semesters?.departments?.name} / {student.semesters?.name}
                    </span>
                  </td>
                  <td>
                    {student.parent_id ? (
                      <span className={styles.statusLinked}>Yes</span>
                    ) : (
                      <span className={styles.statusPending}>Pending</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td>
                      <form action={async () => {
                        'use server'
                        await deleteStudent(student.id)
                      }}>
                        <button type="submit" className={styles.deleteBtn}>
                          Delete
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!students || students.length === 0 && (
            <p className={styles.emptyState}>No students registered yet.</p>
          )}
        </div>
        <Pagination totalPages={totalPages} currentPage={page} />
      </div>
    </div>
  )
}
