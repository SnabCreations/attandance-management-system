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

  let assignments: any[] = []
  let semesterIds: any[] = []

  if (isAdmin) {
    const { data: allSubjects } = await adminClient
      .from('subjects')
      .select('id, name, semester_id, semesters(id, name, departments(id, name))')
    
    if (allSubjects) {
      assignments = allSubjects.map((s: any) => ({
        subject_id: s.id,
        subject_name: s.name,
        semester_id: s.semester_id,
        semester_name: s.semesters?.name || 'Unknown',
        department_id: (s.semesters as any)?.departments?.id,
        department_name: (s.semesters as any)?.departments?.name || 'Unknown',
        subjects: { name: `${(s.semesters as any)?.departments?.name || ''} - ${(s.semesters as any)?.name || ''}: ${s.name}` }
      }))
      semesterIds = allSubjects.map((s: any) => s.semester_id)
    }
  } else if (isTutor) {
    const { data: tutorSemesters } = await adminClient
      .from('semester_tutors')
      .select('semester_id')
      .eq('tutor_id', user.id)
      
    if (tutorSemesters && tutorSemesters.length > 0) {
      const semIds = tutorSemesters.map((s: any) => s.semester_id)
      
      const { data: assignedSemesters } = await adminClient
        .from('semesters')
        .select('id, name, departments(id, name)')
        .in('id', semIds)

      if (assignedSemesters && assignedSemesters.length > 0) {
      const { data: semSubjects } = await adminClient
        .from('subjects')
        .select('id, name, semester_id')
        .in('semester_id', semIds)
        
      if (semSubjects) {
        assignments = semSubjects.map((s: any) => {
          const sem = assignedSemesters.find((x: any) => x.id === s.semester_id)
          return {
            subject_id: s.id,
            subject_name: s.name,
            semester_id: s.semester_id,
            semester_name: sem?.name || 'Unknown',
            department_id: (sem as any)?.departments?.id,
            department_name: (sem as any)?.departments?.name || 'Unknown',
            subjects: { name: `${(sem as any)?.departments?.name || ''} - ${(sem as any)?.name || ''}: ${s.name}` }
          }
        })
        semesterIds = semIds
        }
      }
    }
    
    // Add any specific faculty assignments they might have outside their tutorship
    const { data: facultyAssignments } = await adminClient
      .from('faculty_subjects')
      .select(`
        subject_id,
        semester_id,
        subjects (id, name, semesters(id, name, departments(id, name)))
      `)
      .eq('faculty_id', user.id)
      
    if (facultyAssignments) {
      // Merge unique
      facultyAssignments.forEach((fa: any) => {
        if (!assignments.find((a: any) => a.subject_id === fa.subject_id)) {
          const s = fa.subjects
          assignments.push({
            subject_id: fa.subject_id,
            subject_name: s?.name,
            semester_id: fa.semester_id,
            semester_name: s?.semesters?.name || 'Unknown',
            department_id: (s?.semesters as any)?.departments?.id,
            department_name: (s?.semesters as any)?.departments?.name || 'Unknown',
            subjects: { name: `${(s?.semesters as any)?.departments?.name || ''} - ${(s?.semesters as any)?.name || ''}: ${s?.name}` }
          })
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
        subjects (id, name, semesters(id, name, departments(id, name)))
      `)
      .eq('faculty_id', user.id)
      
    if (facultyAssignments) {
      assignments = facultyAssignments.map((fa: any) => {
        const s = fa.subjects
        return {
          subject_id: fa.subject_id,
          subject_name: s?.name,
          semester_id: fa.semester_id,
          semester_name: s?.semesters?.name || 'Unknown',
          department_id: (s?.semesters as any)?.departments?.id,
          department_name: (s?.semesters as any)?.departments?.name || 'Unknown',
          subjects: { name: `${(s?.semesters as any)?.departments?.name || ''} - ${(s?.semesters as any)?.name || ''}: ${s?.name}` }
        }
      })
    } else {
      assignments = []
    }
    semesterIds = assignments.map((a: any) => a.semester_id)
  }

  if (assignments.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Log Attendance</h2>
          <p className={styles.emptyState}>
            {isAdmin 
              ? "There are no subjects in the system. Create subjects first to log attendance."
              : "You have no subjects assigned to you. Please contact the administrator."}
          </p>
        </div>
      </div>
    )
  }
  
  const { data: students } = await adminClient
    .from('students')
    .select('id, name, roll_no, semester_id')
    .in('semester_id', semesterIds)
    .order('roll_no')

  const sortedStudents = (students || []).sort((a: any, b: any) => 
    String(a.roll_no).localeCompare(String(b.roll_no), undefined, { numeric: true, sensitivity: 'base' })
  )

  const { data: timeSlots } = await adminClient
    .from('time_slots')
    .select('*')
    .order('order_index')

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Log Daily Attendance</h2>
        <p className={styles.subtitle}>Select a subject to view your students and log attendance.</p>
        
        <AttendanceForm 
          assignments={assignments} 
          allStudents={sortedStudents} 
          timeSlots={timeSlots || []}
          canImportExport={isAdmin || isTutor}
        />
      </div>
    </div>
  )
}
