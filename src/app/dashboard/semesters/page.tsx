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

  // Fetch semesters with their associated department names and multiple tutors
  const { data: semesters } = await supabase
    .from('semesters')
    .select('*, departments(name), semester_tutors(tutor_id, users(email))')
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
            <label>Assign Tutors</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxHeight: '150px', overflowY: 'auto' }}>
              {tutors?.map((tutor) => (
                <label key={tutor.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" name="tutor_id" value={tutor.id} style={{ cursor: 'pointer' }} />
                  {tutor.email}
                </label>
              ))}
            </div>
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
                  {sem.semester_tutors && sem.semester_tutors.length > 0 && (
                    <span className={styles.deptBadge} style={{ backgroundColor: 'var(--accent)', marginLeft: '0.5rem' }}>
                      Tutors: {sem.semester_tutors.map((st: any) => st.users?.email).filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span className={styles.semId}>ID: {sem.id}</span>
                  <form action={async () => {
                    'use server'
                    const { createAdminClient } = await import('@/utils/supabase/admin')
                    const adminClient = createAdminClient()
                    await adminClient.from('semesters').delete().eq('id', sem.id)
                    const { revalidatePath } = await import('next/cache')
                    revalidatePath('/dashboard/semesters')
                  }}>
                    <button type="submit" style={{ padding: '0.25rem 0.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                      Delete
                    </button>
                  </form>
                </div>
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
