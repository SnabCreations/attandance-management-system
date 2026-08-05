import { createClient } from '@/utils/supabase/server'
import styles from './students.module.css'
import StudentRegistryForm from './StudentRegistryForm'
import { deleteStudent } from './actions'
import Pagination from '../../components/Pagination'
import StudentTableList from './StudentTableList'

export default async function StudentRegistryPage(props: { searchParams: Promise<{ page?: string; query?: string; semester?: string }> }) {
  const searchParams = await props.searchParams;
  const { query, semester, page: pageStr } = searchParams;
  const page = parseInt(pageStr || '1')
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
      parent_id,
      user_id,
      parent:users!students_parent_id_fkey (avatar_url)
    `)
    .order('roll_no')

  if (!isAdmin && semesters && semesters.length > 0) {
    studentsQuery = studentsQuery.in('semester_id', semesters.map((s: any) => s.id))
  }

  if (query) {
    studentsQuery = studentsQuery.or(`name.ilike.%${query}%,roll_no.ilike.%${query}%`)
  }
  
  if (semester) {
    studentsQuery = studentsQuery.eq('semester_id', parseInt(semester))
  }

  const { data: allStudentsData } = await studentsQuery

  // Sort numerically
  const sortedStudents = (allStudentsData || []).sort((a: any, b: any) => 
    String(a.roll_no).localeCompare(String(b.roll_no), undefined, { numeric: true, sensitivity: 'base' })
  )

  const totalStudents = sortedStudents.length
  const totalPages = Math.ceil(totalStudents / pageSize)
  const students = sortedStudents.slice(from, to + 1)
  
  const basePath = `?query=${query || ''}&semester=${semester || ''}`

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
        
        <form className={styles.filtersForm} style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input type="text" name="query" placeholder="Search by name or roll no" defaultValue={query || ''} className={styles.searchInput} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', flex: 1, minWidth: '200px' }} />
          
          <select name="semester" defaultValue={semester || ''} className={styles.filterSelect} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', minWidth: '150px' }}>
            <option value="">All My Semesters</option>
            {semesters?.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name} ({s.departments?.name})</option>
            ))}
          </select>
          
          <button type="submit" className={styles.filterBtn} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Filter</button>
        </form>

        <StudentTableList students={students || []} isAdmin={!!isAdmin} />
        <Pagination totalPages={totalPages} currentPage={page} basePath={basePath} />
      </div>
    </div>
  )
}
