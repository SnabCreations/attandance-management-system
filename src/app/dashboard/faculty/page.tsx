import { createClient } from '@/utils/supabase/server'
import styles from './faculty.module.css'
import { assignFaculty, deleteAssignment } from './actions'

export default async function FacultyPage() {
  const supabase = await createClient()

  // Use Admin Client to bypass RLS for fetching users securely on the server
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminClient = createAdminClient()

  // Fetch Faculty users
  const { data: facultyUsers } = await adminClient
    .from('users')
    .select('*')
    .contains('roles', ['Faculty'])
    .order('email')

  // Fetch Subjects (with semester info)
  const { data: subjects } = await supabase
    .from('subjects')
    .select(`
      id,
      name,
      semesters (id, name, departments(name))
    `)
    .order('id')

  // Fetch existing assignments
  // Fetch existing assignments using adminClient to bypass RLS on users table
  const { data: assignments } = await adminClient
    .from('faculty_subjects')
    .select(`
      id,
      faculty_id,
      users (email),
      subjects (name),
      semesters (name, departments(name))
    `)
    .order('id')

  // Group assignments by faculty
  const groupedAssignments = assignments?.reduce((acc: any, curr: any) => {
    const email = curr.users?.email || 'Unknown Faculty'
    if (!acc[email]) {
      acc[email] = []
    }
    acc[email].push(curr)
    return acc
  }, {})

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
      <div className={styles.card}>
        <h2>Assign Faculty to Subject</h2>
        <form action={assignFaculty} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="faculty_id">Faculty Member</label>
            <select id="faculty_id" name="faculty_id" required className={styles.select}>
              <option value="">Select Faculty...</option>
              {facultyUsers?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="subject_id">Subject</label>
            <select id="subject_id" name="subject_id" required className={styles.select}>
              <option value="">Select a Subject...</option>
              {subjects?.map((sub: any) => (
                <option key={sub.id} value={`${sub.id}_${sub.semesters.id}`}>
                  {sub.semesters.departments?.name} - {sub.semesters.name} - {sub.name}
                </option>
              ))}
            </select>
          </div>
          
          <button type="submit" className={styles.button}>
            Assign Faculty
          </button>
        </form>
      </div>

      <div className={styles.card}>
        <h2>Current Assignments</h2>
        {groupedAssignments && Object.keys(groupedAssignments).length > 0 ? (
          <div className={styles.groupsContainer}>
            {Object.keys(groupedAssignments).map(facultyEmail => (
              <div key={facultyEmail} className={styles.facultyGroup}>
                <h3 className={styles.facultyTitle}>{facultyEmail}</h3>
                <ul className={styles.list}>
                  {groupedAssignments[facultyEmail].map((assignment: any) => (
                    <li key={assignment.id} className={styles.listItem}>
                      <div className={styles.assignmentInfo}>
                        <span className={styles.badge}>
                          {assignment.semesters?.departments?.name} / {assignment.semesters?.name} / {assignment.subjects?.name}
                        </span>
                      </div>
                      <form action={async () => {
                        'use server'
                        await deleteAssignment(assignment.id)
                      }}>
                        <button type="submit" className={styles.deleteBtn}>Remove</button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>No faculty assigned yet.</p>
        )}
      </div>
    </div>
    </div>
  )
}
