import { createClient } from '@/utils/supabase/server'
import styles from './semesters.module.css'
import { addSemester } from './actions'
import PromoteForm from './PromoteForm'
import BulkSemesterUpload from './BulkSemesterUpload'

export default async function SemestersPage() {
  const supabase = await createClient()

  // Fetch departments for the dropdown
  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .order('name')

  // Use Admin Client to bypass RLS for fetching users securely on the server
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminClient = createAdminClient()

  // Fetch users with the Tutor role
  const { data: tutors } = await adminClient
    .from('users')
    .select('id, email, roles')
    .contains('roles', ['Tutor'])
    .order('email')

  // Fetch semesters with their associated department names and tutor
  const { data: semesters } = await supabase
    .from('semesters')
    .select('*, departments(name), users(email)')
    .order('id')

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Add New Semester</h2>
        <form action={addSemester} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Semester Name</label>
            <input 
              id="name" 
              name="name" 
              type="text" 
              placeholder="e.g. Semester 1" 
              required 
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="department_id">Department</label>
            <select id="department_id" name="department_id" required className={styles.select}>
              <option value="">Select a Department...</option>
              {departments?.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="tutor_id">Assign Tutor (Semester In-Charge)</label>
            <select id="tutor_id" name="tutor_id" className={styles.select}>
              <option value="">None</option>
              {tutors?.map((tutor) => (
                <option key={tutor.id} value={tutor.id}>
                  {tutor.email}
                </option>
              ))}
            </select>
          </div>
          
          <button type="submit" className={styles.button}>
            Create Semester
          </button>
        </form>
        <BulkSemesterUpload departments={departments || []} />
      </div>

      <div className={styles.card}>
        <h2>Existing Semesters</h2>
        {semesters && semesters.length > 0 ? (
          <ul className={styles.list}>
            {semesters.map((sem: any) => (
              <li key={sem.id} className={styles.listItem}>
                <div className={styles.semInfo}>
                  <span className={styles.semName}>{sem.name}</span>
                  <span className={styles.deptBadge}>{sem.departments?.name}</span>
                  {sem.users?.email && (
                    <span className={styles.deptBadge} style={{ backgroundColor: 'var(--accent)', marginLeft: '0.5rem' }}>
                      Tutor: {sem.users.email}
                    </span>
                  )}
                </div>
                <span className={styles.semId}>ID: {sem.id}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>No semesters found. Add one above!</p>
        )}
      </div>

      <div className={styles.card}>
        <h2>Promote Batch (Roll-Forward)</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Move all students from one semester into the next semester.
        </p>
        <PromoteForm semesters={semesters || []} />
      </div>
    </div>
  )
}
