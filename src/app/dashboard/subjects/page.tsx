import { createClient } from '@/utils/supabase/server'
import styles from './subjects.module.css'
import { addSubject } from './actions'

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
        name,
        departments (name)
      )
    `)
    .order('id')

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Add New Subject</h2>
        <form action={addSubject} className={styles.form}>
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
          
          <div className={styles.inputGroup}>
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
          
          <button type="submit" className={styles.button}>
            Create Subject
          </button>
        </form>
      </div>

      <div className={styles.card}>
        <h2>Existing Subjects</h2>
        {subjects && subjects.length > 0 ? (
          <ul className={styles.list}>
            {subjects.map((sub: any) => (
              <li key={sub.id} className={styles.listItem}>
                <div className={styles.subInfo}>
                  <span className={styles.subName}>{sub.name}</span>
                  <span className={styles.badge}>
                    {sub.semesters?.departments?.name} / {sub.semesters?.name}
                  </span>
                </div>
                <span className={styles.subId}>ID: {sub.id}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>No subjects found. Add one above!</p>
        )}
      </div>
    </div>
  )
}
