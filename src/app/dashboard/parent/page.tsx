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
    // 1. Fetch Attendance Stats
    const { data: attendanceStats } = await supabase
      .from('attendance')
      .select('status, is_extra_hours')
      .eq('student_id', child.id)
      
    const totalLogs = attendanceStats?.length || 0
    const presentLogs = attendanceStats?.filter(a => a.status === 'Present').length || 0
    const attendancePercentage = totalLogs > 0 ? Math.round((presentLogs / totalLogs) * 100) : 100

    // 1.5 Fetch Recent Attendance Logs with Timeline Slots
    const { data: recentAttendance } = await supabase
      .from('attendance')
      .select(`
        id,
        date,
        status,
        hours,
        is_extra_hours,
        subjects(name),
        attendance_hours(
          time_slots(name, start_time, end_time)
        )
      `)
      .eq('student_id', child.id)
      .order('date', { ascending: false })
      .limit(10)

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

    // 3. Fetch Tests
    const { data: tests } = await supabase
      .from('student_tests')
      .select(`
        id,
        status,
        marks_obtained,
        tests (title, test_date, max_marks, subjects(name))
      `)
      .eq('student_id', child.id)
      .order('id', { ascending: false })

    // 4. Fetch Study Materials for child's semester
    let studyMaterials = []
    if (child.semesters) {
      // Find the semester id by looking up the student record
      const { data: studentRecord } = await supabase
        .from('students')
        .select('semester_id')
        .eq('id', child.id)
        .single()
        
      if (studentRecord) {
        const { data: materials } = await supabase
          .from('study_materials')
          .select('*, subjects(name)')
          .eq('semester_id', studentRecord.semester_id)
          .order('created_at', { ascending: false })
          
        studyMaterials = materials || []
      }
    }

    return {
      ...child,
      stats: {
        totalLogs,
        presentLogs,
        attendancePercentage
      },
      assignments: assignments || [],
      recentAttendance: recentAttendance || [],
      tests: tests || [],
      studyMaterials
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

          <div className={styles.assignmentsCard} style={{ marginTop: '2rem' }}>
            <h3>Recent Tests</h3>
            {child.tests.length > 0 ? (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Test Title</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {child.tests.map((test: any) => (
                      <tr key={test.id}>
                        <td>{test.tests?.subjects?.name}</td>
                        <td><strong>{test.tests?.title}</strong></td>
                        <td>{new Date(test.tests?.test_date).toLocaleDateString()}</td>
                        <td>
                          <span className={`${styles.badge} ${test.status === 'Evaluated' ? styles.submitted : (test.status === 'Absent' ? styles.missing : '')}`}>
                            {test.status}
                          </span>
                        </td>
                        <td className={styles.marks}>
                          {test.marks_obtained !== null ? `${test.marks_obtained} / ${test.tests?.max_marks}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.emptyState}>No tests logged yet.</p>
            )}
          </div>

          <div className={styles.assignmentsCard} style={{ marginTop: '2rem' }}>
            <h3>Study Materials</h3>
            {child.studyMaterials.length > 0 ? (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Material</th>
                      <th>Type</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {child.studyMaterials.map((mat: any) => (
                      <tr key={mat.id}>
                        <td>{mat.subjects?.name}</td>
                        <td>
                          <strong>{mat.title}</strong>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{mat.description}</div>
                        </td>
                        <td>
                          <span className={styles.badge} style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-color)' }}>
                            {mat.type}
                          </span>
                        </td>
                        <td>
                          {mat.url && (
                            <a href={mat.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}>
                              View &rarr;
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.emptyState}>No study materials available.</p>
            )}
          </div>

          <div className={styles.assignmentsCard} style={{ marginTop: '2rem' }}>
            <h3>Recent Attendance Logs</h3>
            {child.recentAttendance.length > 0 ? (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Timeline (Slots)</th>
                      <th>Extra?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {child.recentAttendance.map((log: any) => (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.date).toLocaleDateString()}</td>
                        <td>{log.subjects?.name}</td>
                        <td>
                          <span className={`${styles.badge} ${log.status === 'Present' ? styles.submitted : styles.missing}`}>
                            {log.status}
                          </span>
                        </td>
                        <td>
                          {log.attendance_hours && log.attendance_hours.length > 0 ? (
                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                              {log.attendance_hours.map((ah: any, idx: number) => (
                                <span key={idx} style={{ 
                                  backgroundColor: 'var(--bg-canvas)', 
                                  border: '1px solid var(--border-color)', 
                                  padding: '0.125rem 0.375rem', 
                                  borderRadius: '4px', 
                                  fontSize: '0.75rem',
                                  color: 'var(--text-secondary)'
                                }}>
                                  {ah.time_slots?.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{log.hours} Hrs (Legacy)</span>
                          )}
                        </td>
                        <td>{log.is_extra_hours ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.emptyState}>No attendance logged yet.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
