import { createClient } from '@/utils/supabase/server'
import styles from './students.module.css'
import StudentRegistryForm from '../tutor/students/StudentRegistryForm'
import { deleteStudent, resetParentPassword } from '../tutor/students/actions'
import { toggleBlockUser } from '../users/actions'
import Pagination from '../components/Pagination'

export default async function AdminStudentRegistryPage({
  searchParams
}: {
  searchParams: Promise<{ query?: string; department?: string; semester?: string; page?: string }>
}) {
  const { query, department, semester, page: pageStr } = await searchParams;
  const page = parseInt(pageStr || '1')
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userProfile } = await supabase.from('users').select('roles').eq('id', user.id).single()
  const isAdmin = userProfile?.roles?.includes('Admin')

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Unauthorized</h2>
        </div>
      </div>
    )
  }

  // Fetch departments and semesters for filters
  const { data: departments } = await supabase.from('departments').select('*').order('name')
  const { data: allSemesters } = await supabase.from('semesters').select('*').order('name')

  let studentsQuery = supabase
    .from('students')
    .select(`
      id,
      name,
      roll_no,
      semester_id,
      department_id,
      semesters (name, departments(name)),
      parent_id,
      parent:users!students_parent_id_fkey (email),
      updater:users!students_updated_by_fkey (email)
    `)
    .order('roll_no')

  if (query) {
    studentsQuery = studentsQuery.or(`name.ilike.%${query}%,roll_no.ilike.%${query}%`)
  }
  if (department) {
    studentsQuery = studentsQuery.eq('department_id', parseInt(department))
  }
  if (semester) {
    studentsQuery = studentsQuery.eq('semester_id', parseInt(semester))
  }

  const { count: totalStudents } = await supabase.from('students').select('*', { count: 'exact', head: true })
  
  const { data: students } = await studentsQuery.range(from, to)
  const totalPages = Math.ceil((totalStudents || 0) / pageSize)

  const basePath = `?query=${query || ''}&department=${department || ''}&semester=${semester || ''}`

  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminClient = createAdminClient()
  const { data: authData } = await adminClient.auth.admin.listUsers()

  const mappedStudents = students?.map((student: any) => {
    let parentEmail = student.parent?.email
    let updatedByEmail = student.updater?.email || 'N/A'
    let isBlocked = false
    
    if (student.parent_id) {
      const authUser = authData?.users?.find(u => u.id === student.parent_id)
      isBlocked = authUser?.banned_until != null
    }

    return {
      ...student,
      parentEmail,
      updatedByEmail,
      isBlocked
    }
  })

  return (
    <div className={styles.container}>
      <StudentRegistryForm semesters={allSemesters || []} />

      <div className={styles.card}>
        <h2>Student & Parent Registry</h2>
        
        <form className={styles.filtersForm}>
          <input type="text" name="query" placeholder="Search by name or roll no" defaultValue={query || ''} className={styles.searchInput} />
          
          <select name="department" defaultValue={department || ''} className={styles.filterSelect}>
            <option value="">All Departments</option>
            {departments?.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          
          <select name="semester" defaultValue={semester || ''} className={styles.filterSelect}>
            <option value="">All Semesters</option>
            {allSemesters?.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          
          <button type="submit" className={styles.filterBtn}>Filter</button>
        </form>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Department / Semester</th>
                <th>Parent Linked</th>
                <th>Last Updated By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappedStudents?.map((student: any) => (
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span className={styles.statusLinked}>Yes: {student.parentEmail}</span>
                        {student.isBlocked && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>BLOCKED</span>}
                      </div>
                    ) : (
                      <span className={styles.statusPending}>Pending</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{student.updatedByEmail}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {student.parent_id && (
                        <form action={toggleBlockUser}>
                          <input type="hidden" name="user_id" value={student.parent_id} />
                          <input type="hidden" name="current_status" value={student.isBlocked ? 'blocked' : 'active'} />
                          <button type="submit" style={{ padding: '0.375rem 0.75rem', backgroundColor: student.isBlocked ? '#10b981' : '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
                            {student.isBlocked ? 'Unblock Parent' : 'Block Parent'}
                          </button>
                        </form>
                      )}
                      
                      
                      {student.parent_id && (
                        <form action={async () => {
                          'use server'
                          await resetParentPassword(student.parent_id)
                        }}>
                          <button type="submit" style={{ padding: '0.375rem 0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
                            Reset Password
                          </button>
                        </form>
                      )}
                      
                      <form action={async () => {
                        'use server'
                        await deleteStudent(student.id)
                      }}>
                        <button type="submit" className={styles.deleteBtn}>
                          Delete Student
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!mappedStudents || mappedStudents.length === 0 && (
            <p className={styles.emptyState}>No students match the criteria.</p>
          )}
        </div>
        <Pagination totalPages={totalPages} currentPage={page} basePath={basePath} />
      </div>
    </div>
  )
}
