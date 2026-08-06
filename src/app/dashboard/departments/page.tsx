import { createClient } from '@/utils/supabase/server'
import styles from './departments.module.css'
import { addDepartment } from './actions'

export default async function DepartmentsPage() {
  const supabase = await createClient()

  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .order('name')

  return (
    <div className={styles.container}>
      {/* <div className={styles.card}>
        <h2>Add New Department</h2>
        <form action={addDepartment} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Department Name</label>
            <input 
              id="name" 
              name="name" 
              type="text" 
              placeholder="e.g. Computer Science" 
              required 
            />
          </div>
          <div className={styles.inputGroup} style={{ marginTop: '1rem' }}>
            <label htmlFor="code">Department Code</label>
            <input 
              id="code" 
              name="code" 
              type="text" 
              placeholder="e.g. cs" 
              required 
            />
          </div>
          <button type="submit" className={styles.button} style={{ marginTop: '1rem' }}>
            Create Department
          </button>
        </form>
      </div> */}

      <div className={styles.card}>
        <h2>Existing Departments</h2>
        {departments && departments.length > 0 ? (
          <ul className={styles.list}>
            {departments.map((dept) => (
              <li key={dept.id} className={styles.listItem}>
                <span className={styles.deptName}>{dept.name}</span>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span className={styles.deptId}>Code: {dept.code || 'N/A'}</span>
                  <span className={styles.deptId}>ID: {dept.id}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>No departments found. Add one above!</p>
        )}
      </div>
    </div>
  )
}
