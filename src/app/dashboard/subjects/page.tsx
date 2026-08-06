import { createClient } from '@/utils/supabase/server'
import styles from './subjects.module.css'
import { addSubject } from './actions'
import BulkSubjectUpload from './BulkSubjectUpload'
import SubjectRow from './SubjectRow'

export default async function SubjectsPage() {
  const supabase = await createClient()

  // Fetch semesters for the dropdown (including their department names for context)
  const { data: semesters } = await supabase
    .from('semesters')
    .select('*, departments(name)')
    .order('department_id')

  // Fetch subjects with their associated semester and department
  const { data: subjects } = await supabase
    .from('subjects')
    .select(`
      *,
      semesters (
        id,
        name,
        departments (name)
      )
    `)
    .order('id')

  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminClient = createAdminClient()

  // Fetch all faculty subjects to map assignments
  const { data: facultySubjects } = await adminClient
    .from('faculty_subjects')
    .select('*')

  // Fetch all faculty users
  const { data: allUsers } = await adminClient
    .from('users')
    .select('id, email, roles')
    .contains('roles', ['Faculty'])

  const facultyMembers = allUsers || []

  // Group subjects by semester
  const groupedSubjects = subjects?.reduce((acc: any, sub: any) => {
    const semKey = `${sub.semesters?.departments?.name} - ${sub.semesters?.name}`
    if (!acc[semKey]) {
      acc[semKey] = []
    }
    acc[semKey].push(sub)
    return acc
  }, {})

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Add New Subject</h2>
        <form action={addSubject} className={styles.form}>
          <div className={styles.gridForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="code">Subject Code</label>
              <input 
                id="code" 
                name="code" 
                type="text" 
                placeholder="e.g. CS101" 
                required 
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="name">Subject Name</label>
              <input 
                id="name" 
                name="name" 
                type="text" 
                placeholder="e.g. Database Systems" 
                required 
              />
            </div>
            
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="semester_id">Semester</label>
              <select id="semester_id" name="semester_id" required className={styles.select}>
                <option value="">Select a Semester...</option>
                {semesters?.map((sem: any) => (
                  <option key={sem.id} value={sem.id}>
                    {sem.departments?.name} - {sem.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <button type="submit" className={styles.button}>
            Create Subject
          </button>
        </form>
        <BulkSubjectUpload semesters={semesters || []} />
      </div>

      <div className={styles.card}>
        <h2>Existing Subjects (Grouped by Semester)</h2>
        {groupedSubjects && Object.keys(groupedSubjects).length > 0 ? (
          <div className={styles.groupsContainer}>
            {Object.keys(groupedSubjects).map(semesterName => (
              <div key={semesterName} className={styles.semesterGroup}>
                <h3 className={styles.semesterTitle}>{semesterName}</h3>
                <ul className={styles.list}>
                  {groupedSubjects[semesterName].map((sub: any) => {
                    const assignment = facultySubjects?.find(fa => fa.subject_id === sub.id)
                    return (
                      <SubjectRow 
                        key={sub.id} 
                        sub={sub} 
                        facultyMembers={facultyMembers} 
                        assignedFacultyId={assignment?.faculty_id} 
                      />
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>No subjects found. Add one above!</p>
        )}
      </div>
    </div>
  )
}
