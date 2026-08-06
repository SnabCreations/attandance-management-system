import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import styles from '../page.module.css'
import { GraduationCap, ClipboardCheck, FileText, Clock } from 'lucide-react'
import TimetableViewer from './TimetableViewer'

export default async function FacultyPanel({ userId }: { userId: string }) {
  const adminClient = createAdminClient()
  
  const { data: assignments } = await adminClient
    .from('faculty_subjects')
    .select(`
      subject_id,
      subjects (name, code),
      semesters (name, departments(name))
    `)
    .eq('faculty_id', userId)

  const subjectIds = assignments?.map(a => a.subject_id) || []
  
  let activeAssignments: any[] = []
  if (subjectIds.length > 0) {
    const { data: recentAssignments } = await adminClient
      .from('assignments')
      .select('id, title, due_date, subjects(name)')
      .in('subject_id', subjectIds)
      .order('due_date', { ascending: false })
      .limit(3)
    activeAssignments = recentAssignments || []
  }

  // Get current day of week (1 = Monday, 7 = Sunday)
  let today = new Date().getDay()
  if (today === 0) today = 7

  const { data: upcomingClasses } = await adminClient
    .from('timetables')
    .select(`
      id,
      hour_slot,
      subjects(name, code),
      semesters(name, departments(name))
    `)
    .eq('faculty_id', userId)
    .eq('day_of_week', today)
    .order('hour_slot', { ascending: true })

  const { data: timeSlots } = await adminClient
    .from('time_slots')
    .select('id, name')
    .order('order_index')

  const { data: allFacultySlots } = await adminClient
    .from('timetables')
    .select('*, subjects(name), users(email, raw_user_meta_data)')
    .eq('faculty_id', userId)

  const mockSemester = {
    id: 0,
    name: "Faculty Schedule",
    departments: { name: "Personal" }
  }

  return (
    <div className={styles.dashboardSection}>
      <h2 className={styles.sectionTitle}><GraduationCap size={24} /> Faculty Overview</h2>
      
      <div className={styles.grid}>
        <div className={styles.statCard}>
          <h3 className={styles.statTitle}>Subjects Assigned</h3>
          <p className={styles.statNumber}>{assignments?.length || 0}</p>
        </div>
      </div>
      
      {assignments && assignments.length > 0 && (
        <div className={styles.fullWidthCard} style={{ marginTop: '2rem' }}>
          <h3 className={styles.statTitle} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} /> Assigned Subjects
          </h3>
          <ul className={styles.list}>
            {assignments.map((a: any) => (
              <li key={a.subject_id} className={styles.listItem}>
                <div>
                  <span className={styles.itemTitle}>{a.subjects?.name}</span>
                  <div className={styles.itemSubtitle}>{a.subjects?.code}</div>
                </div>
                <span className={styles.badge}>
                  {a.semesters?.departments?.name} / {a.semesters?.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {upcomingClasses && upcomingClasses.length > 0 && (
        <div className={styles.fullWidthCard} style={{ marginTop: '2rem' }}>
          <h3 className={styles.statTitle} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} /> Today's Classes
          </h3>
          <ul className={styles.list}>
            {upcomingClasses.map((cls: any) => {
              const timeSlot = timeSlots?.find(ts => ts.id === cls.hour_slot)
              return (
              <li key={cls.id} className={styles.listItem}>
                <div>
                  <span className={styles.itemTitle}>{timeSlot ? timeSlot.name : `Hour ${cls.hour_slot}`}</span>
                  <div className={styles.itemSubtitle}>{cls.subjects?.name || (Array.isArray(cls.subjects) ? cls.subjects[0]?.name : '')} ({cls.subjects?.code || (Array.isArray(cls.subjects) ? cls.subjects[0]?.code : '')})</div>
                </div>
                <span className={styles.badge}>
                  {(cls.semesters?.departments?.name || (Array.isArray(cls.semesters?.departments) ? cls.semesters.departments[0]?.name : ''))} / {cls.semesters?.name || (Array.isArray(cls.semesters) ? cls.semesters[0]?.name : '')}
                </span>
              </li>
              )
            })}
          </ul>
        </div>
      )}

      {activeAssignments.length > 0 && (
        <div className={styles.fullWidthCard} style={{ marginTop: '2rem' }}>
          <h3 className={styles.statTitle} style={{ marginBottom: '1rem' }}>Recent Assignments Created</h3>
          <ul className={styles.list}>
            {activeAssignments.map(a => (
              <li key={a.id} className={styles.listItem}>
                <div>
                  <span className={styles.itemTitle}>{a.title}</span>
                  <div className={styles.itemSubtitle}>{a.subjects?.name}</div>
                </div>
                {a.due_date && <span className={styles.badge}>Due: {new Date(a.due_date).toLocaleDateString()}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.fullWidthCard} style={{ marginTop: '2rem' }}>
        <h3 className={styles.statTitle} style={{ marginBottom: '1rem' }}>Your Weekly Timetable</h3>
        <TimetableViewer 
          semester={mockSemester} 
          slots={allFacultySlots || []} 
          timeSlots={timeSlots || []} 
        />
      </div>
      
      <div className={styles.buttonGroup}>
        <Link href="/dashboard/faculty/attendance" className={styles.actionButton}>
          <ClipboardCheck size={18} /> Mark Attendance
        </Link>
        <Link href="/dashboard/faculty/assignments" className={styles.actionButton}>
          <FileText size={18} /> Manage Assignments
        </Link>
      </div>
    </div>
  )
}
