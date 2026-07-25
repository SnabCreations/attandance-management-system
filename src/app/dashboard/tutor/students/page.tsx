import { createClient } from '@/utils/supabase/server'
import styles from './students.module.css'
import { addStudent } from './actions'

export default async function StudentRegistryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userProfile } = await supabase.from('users').select('roles').eq('id', user.id).single()
  const isAdmin = userProfile?.roles?.includes('Admin')

  let semesterQuery = supabase
    .from('semesters')
    .select('id, name, department_id, departments(name)')
    .order('department_id')

  if (!isAdmin) {
    semesterQuery = semesterQuery.eq('tutor_id', user.id)
  }

  const { data: semesters } = await semesterQuery

  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminClient = createAdminClient()

  const { data: parents } = await adminClient
    .from('users')
    .select('id, email')
    .contains('roles', ['Parent'])
    .order('email')

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

  const { data: students } = await studentsQuery

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
      <div className={styles.card}>
        <h2>Register New Student</h2>
        <form action={addStudent} className={styles.form}>
          <div className={styles.gridForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="name">Full Name</label>
              <input 
                id="name" 
                name="name" 
                type="text" 
                placeholder="e.g. John Doe" 
                required 
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="roll_no">Roll Number</label>
              <input 
                id="roll_no" 
                name="roll_no" 
                type="text" 
                placeholder="e.g. CS24001" 
                required 
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="semester_id">Semester & Department</label>
              <select id="semester_id" name="semester_id" required className={styles.select}>
                <option value="">Select a Semester...</option>
                {semesters?.map((sem: any) => (
                  <option key={sem.id} value={`${sem.id}_${sem.department_id}`}>
                    {sem.departments?.name} - {sem.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="parent_id">Link Parent Account (Optional)</label>
              <select id="parent_id" name="parent_id" className={styles.select}>
                <option value="">No Parent Linked</option>
                {parents?.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <button type="submit" className={styles.button}>
            Add Student
          </button>
        </form>
      </div>

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
                </tr>
              ))}
            </tbody>
          </table>
          {!students || students.length === 0 && (
            <p className={styles.emptyState}>No students registered yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
