import { createClient } from '@/utils/supabase/server'
import styles from '../parent/parent.module.css'
import Link from 'next/link'
import TimetableViewer from '../components/TimetableViewer'
import AvatarUpload from '../components/AvatarUpload'

export default async function StudentDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch student record for this user
  const { data: student } = await supabase
    .from('students')
    .select(`
      id,
      name,
      roll_no,
      semester_id,
      semesters (name, departments(name))
    `)
    .eq('user_id', user.id)
    .single()

  const { data: userProfile } = await supabase
    .from('users')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  if (!student) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Student Portal</h2>
          <p className={styles.emptyState}>
            No student profile found for your account. Please contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  // 1. Fetch Attendance Stats
  const { data: attendanceStats } = await supabase
    .from('attendance')
    .select('status, is_extra_hours')
    .eq('student_id', student.id)
    
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
    .eq('student_id', student.id)
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
    .eq('student_id', student.id)
    .order('id', { ascending: false })
    .limit(5)

  // 3. Fetch Tests
  const { data: tests } = await supabase
    .from('student_tests')
    .select(`
      id,
      status,
      marks_obtained,
      tests (title, test_date, max_marks, subjects(name))
    `)
    .eq('student_id', student.id)
    .order('id', { ascending: false })
    .limit(5)

  // 4. Fetch Timetable
  const { data: timetableSlots } = await supabase
    .from('timetable_slots')
    .select(`
      id, faculty_id, subject_id, day_of_week, hour_slot,
      subjects(name),
      users(email)
    `)
    .eq('semester_id', student.semester_id)
    
  const { data: timeSlots } = await supabase
    .from('time_slots')
    .select('*')
    .order('order_index')

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>My Progress Dashboard</h1>
      
      <div className={styles.childSection}>
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div style={{ transform: 'scale(1.2)' }}>
              <AvatarUpload userId={user.id} initialAvatarUrl={userProfile?.avatar_url || null} />
            </div>
            <div>
              <h2 className={styles.childName}>{student.name}</h2>
              <p className={styles.childInfo}>
                Roll No: <strong>{student.roll_no}</strong> | 
                Batch: {(student.semesters as any)?.departments?.name} - {(student.semesters as any)?.name}
              </p>
            </div>
          </div>
          
          <div className={styles.statsGrid}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Attendance</span>
              <span className={`${styles.metricValue} ${attendancePercentage < 75 ? styles.danger : styles.good}`}>
                {attendancePercentage}%
              </span>
              <span className={styles.statSub} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {presentLogs} / {totalLogs} Days Present
              </span>
            </div>
          </div>
        </div>

        <div className={styles.assignmentsCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Recent Assignments</h3>
            <Link href="/dashboard/student/assignments" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontSize: '0.875rem' }}>View All</Link>
          </div>
          {assignments && assignments.length > 0 ? (
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
                  {assignments.map((assignment: any) => (
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Recent Tests</h3>
            <Link href="/dashboard/student/tests" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontSize: '0.875rem' }}>View All</Link>
          </div>
          {tests && tests.length > 0 ? (
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
                  {tests.map((test: any) => (
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
          <h3>Recent Attendance Logs</h3>
          {recentAttendance && recentAttendance.length > 0 ? (
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
                  {recentAttendance.map((log: any) => (
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

        <div className={styles.assignmentsCard} style={{ marginTop: '2rem' }}>
          <TimetableViewer 
            semester={student.semesters} 
            slots={timetableSlots || []} 
            timeSlots={timeSlots || undefined} 
          />
        </div>
      </div>
    </div>
  )
}
