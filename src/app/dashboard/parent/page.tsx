import { createClient } from '@/utils/supabase/server'
import styles from './parent.module.css'

export default async function ParentPortalPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch children (students linked to this parent)
  const { data: children } = await supabase
    .from('students')
    .select(`
      id,
      name,
      roll_no,
      semesters (name, departments(name))
    `)
    .eq('parent_id', user.id)

  if (!children || children.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Parent Portal</h2>
          <p className={styles.emptyState}>
            No students are currently linked to your account. Please contact the class tutor to link your child to this email address.
          </p>
        </div>
      </div>
    )
  }

  // Fetch data for each child
  const childrenData = await Promise.all(children.map(async (child) => {
    // 1. Fetch Attendance
    const { data: attendance } = await supabase
      .from('attendance')
      .select('status, is_extra_hours')
      .eq('student_id', child.id)
      
    const totalLogs = attendance?.length || 0
    const presentLogs = attendance?.filter(a => a.status === 'Present').length || 0
    const attendancePercentage = totalLogs > 0 ? Math.round((presentLogs / totalLogs) * 100) : 100

    // 2. Fetch Assignments
    const { data: assignments } = await supabase
      .from('student_assignments')
      .select(`
        id,
        status,
        marks,
        assignments (title, due_date, subjects(name))
      `)
      .eq('student_id', child.id)
      .order('id', { ascending: false })

    return {
      ...child,
      stats: {
        totalLogs,
        presentLogs,
        attendancePercentage
      },
      assignments: assignments || []
    }
  }))

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>My Children</h1>
      
      {childrenData.map((child) => (
        <div key={child.id} className={styles.childSection}>
          <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <div className={styles.avatar}>{child.name.charAt(0)}</div>
              <div>
                <h2 className={styles.childName}>{child.name}</h2>
                <p className={styles.childInfo}>
                  Roll No: <strong>{child.roll_no}</strong> | 
                  Batch: {(child.semesters as any)?.departments?.name} - {(child.semesters as any)?.name}
                </p>
              </div>
            </div>
            
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Attendance</span>
                <span className={`${styles.statValue} ${child.stats.attendancePercentage < 75 ? styles.textDanger : styles.textSuccess}`}>
                  {child.stats.attendancePercentage}%
                </span>
                <span className={styles.statSub}>
                  {child.stats.presentLogs} / {child.stats.totalLogs} Days Present
                </span>
              </div>
            </div>
          </div>

          <div className={styles.assignmentsCard}>
            <h3>Recent Assignments</h3>
            {child.assignments.length > 0 ? (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Assignment</th>
                      <th>Status</th>
                      <th>Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {child.assignments.map((assignment: any) => (
                      <tr key={assignment.id}>
                        <td>{assignment.assignments?.subjects?.name}</td>
                        <td>
                          <strong>{assignment.assignments?.title}</strong>
                          <div className={styles.dueDate}>Due: {new Date(assignment.assignments?.due_date).toLocaleDateString()}</div>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${styles[assignment.status.toLowerCase()]}`}>
                            {assignment.status}
                          </span>
                        </td>
                        <td className={styles.marks}>
                          {assignment.marks !== null ? `${assignment.marks}/100` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.emptyState}>No assignments given yet.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
