import { createClient } from '@/utils/supabase/server'
import AttendanceForm from './AttendanceForm'
import styles from './attendance.module.css'

export default async function AttendancePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userProfile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  const roles = userProfile?.roles || []
  const isAdmin = roles.includes('Admin')
  const isTutor = roles.includes('Tutor')

  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminClient = createAdminClient()

  let assignments = []
  let semesterIds = []

  if (isAdmin) {
    const { data: allSubjects } = await adminClient
      .from('subjects')
      .select('id, name, semester_id, semesters(name, departments(name))')
    
    if (allSubjects) {
      assignments = allSubjects.map((s: any) => ({
        subject_id: s.id,
        semester_id: s.semester_id,
        subjects: { name: `${s.semesters?.departments?.name || ''} - ${s.semesters?.name || ''}: ${s.name}` }
      }))
      semesterIds = allSubjects.map((s: any) => s.semester_id)
    }
  } else if (isTutor) {
    // Fetch all subjects for the semesters assigned to this tutor
    const { data: assignedSemesters } = await adminClient
      .from('semesters')
      .select('id, name, departments(name)')
      .eq('tutor_id', user.id)
      
    if (assignedSemesters && assignedSemesters.length > 0) {
      const semIds = assignedSemesters.map((s: any) => s.id)
      const { data: semSubjects } = await adminClient
        .from('subjects')
        .select('id, name, semester_id')
        .in('semester_id', semIds)
        
      if (semSubjects) {
        assignments = semSubjects.map((s: any) => {
          const sem = assignedSemesters.find((x: any) => x.id === s.semester_id)
          return {
            subject_id: s.id,
            semester_id: s.semester_id,
            subjects: { name: `${sem?.departments?.name || ''} - ${sem?.name || ''}: ${s.name}` }
          }
        })
        semesterIds = semIds
      }
    }
    
    // Add any specific faculty assignments they might have outside their tutorship
    const { data: facultyAssignments } = await adminClient
      .from('faculty_subjects')
      .select(`
        subject_id,
        semester_id,
        subjects (name)
      `)
      .eq('faculty_id', user.id)
      
    if (facultyAssignments) {
      // Merge unique
      facultyAssignments.forEach((fa: any) => {
        if (!assignments.find((a: any) => a.subject_id === fa.subject_id)) {
          assignments.push(fa)
        }
      })
      semesterIds = [...new Set([...semesterIds, ...facultyAssignments.map((a: any) => a.semester_id)])]
    }
  } else {
    // Fetch subjects assigned to this faculty ONLY
    const { data: facultyAssignments } = await adminClient
      .from('faculty_subjects')
      .select(`
        subject_id,
        semester_id,
        subjects (name)
      `)
      .eq('faculty_id', user.id)
      
    assignments = facultyAssignments || []
    semesterIds = assignments.map((a: any) => a.semester_id)
  }

  if (assignments.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Log Attendance</h2>
          <p className={styles.emptyState}>You have no subjects assigned to you. Please contact the administrator.</p>
        </div>
      </div>
    )
  }
  
  const { data: students } = await adminClient
    .from('students')
    .select('id, name, roll_no, semester_id')
    .in('semester_id', semesterIds)
    .order('roll_no')

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Log Daily Attendance</h2>
        <p className={styles.subtitle}>Select a subject to view your students and log attendance.</p>
        
        <AttendanceForm 
          assignments={assignments} 
          allStudents={students || []} 
        />
      </div>
    </div>
  )
}
