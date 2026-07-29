import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import styles from './timetables.module.css'
import TimetableGrid from './TimetableGrid'

export default async function TimetablesPage({ searchParams }: { searchParams: Promise<{ dept?: string }> }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userProfile } = await supabase.from('users').select('roles').eq('id', user.id).single()
  const isAdmin = userProfile?.roles?.includes('Admin')
  const isTutor = userProfile?.roles?.includes('Tutor')

  if (!isAdmin && !isTutor) {
    return <div className={styles.container}><h2>Unauthorized</h2></div>
  }

  // Fetch all semesters or tutor's semesters
  let semesterQuery = supabase
    .from('semesters')
    .select('id, name, department_id, departments(name, id)')
    .order('department_id')

  if (!isAdmin && isTutor) {
    semesterQuery = semesterQuery.eq('tutor_id', user.id)
  }

  const resolvedSearchParams = await searchParams
  if (resolvedSearchParams.dept) {
    semesterQuery = semesterQuery.eq('department_id', resolvedSearchParams.dept)
  }

  const { data: semesters } = await semesterQuery

  const adminClient = createAdminClient()
  
  // Also get all departments for the filter dropdown
  const { data: allDepts } = await supabase.from('departments').select('id, name').order('name')
  
  const { data: faculties } = await adminClient
    .from('users')
    .select('id, email')
    .contains('roles', ['Faculty'])
    
  const { data: subjects } = await adminClient
    .from('subjects')
    .select('id, name, code, semester_id')

  // Fetch all timetables for the relevant semesters
  const { data: timetables } = await adminClient
    .from('timetables')
    .select('*')
    .in('semester_id', semesters?.map(s => s.id) || [])

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Timetable Management</h2>
          <p>Assign subjects and faculty to specific hour slots for each day.</p>
        </div>
        <form style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label htmlFor="dept" style={{ fontWeight: 500, fontSize: '0.875rem' }}>Filter Department:</label>
          <select 
            name="dept" 
            id="dept" 
            defaultValue={resolvedSearchParams.dept || ''}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">All Departments</option>
            {allDepts?.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', backgroundColor: '#2563eb', color: 'white', cursor: 'pointer' }}>
            Filter
          </button>
        </form>
      </div>
      
      {semesters?.map((semester: any) => {
        const semesterSlots = timetables?.filter(t => t.semester_id === semester.id) || []
        const semesterSubjects = subjects?.filter(s => s.semester_id === semester.id) || []
        
        return (
          <TimetableGrid 
            key={semester.id} 
            semester={semester} 
            slots={semesterSlots} 
            faculties={faculties || []}
            subjects={semesterSubjects}
          />
        )
      })}
      
      {(!semesters || semesters.length === 0) && (
        <div className={styles.card}>
          <p>No semesters found to manage timetables.</p>
        </div>
      )}
    </div>
  )
}
