import { createClient } from '@/utils/supabase/server'
import styles from './hours.module.css'
import { addTimeSlot, deleteTimeSlot } from './actions'
import HoursFilter from './HoursFilter'

export default async function HoursManagementPage({
  searchParams
}: {
  searchParams: Promise<{ semester_id?: string }>
}) {
  const { semester_id } = await searchParams;
  const parsedSemesterId = semester_id ? parseInt(semester_id) : null;

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userProfile } = await supabase.from('users').select('roles').eq('id', user.id).single()
  if (!userProfile?.roles?.includes('Admin')) {
    return <div className={styles.container}><h2>Unauthorized</h2></div>
  }

  let query = supabase.from('time_slots').select('*').order('order_index')
  
  if (parsedSemesterId) {
    query = query.eq('semester_id', parsedSemesterId)
  } else {
    query = query.is('semester_id', null)
  }

  const { data: timeSlots } = await query

  const { data: semesters } = await supabase.from('semesters').select('*').order('name')

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Hours Management</h1>
        <p className={styles.subtitle}>Configure daily time slots for timetables and attendance logs.</p>
        
        <HoursFilter semesters={semesters || []} currentSemesterId={semester_id || ''} />
      </div>

      <div className={styles.card}>
        <h2>Add Time Slot {parsedSemesterId ? `for Selected Semester` : `(Common)`}</h2>
        <form action={addTimeSlot} className={styles.form}>
          <input type="hidden" name="semester_id" value={semester_id || ''} />
          <div className={styles.inputGroup}>
            <label>Slot Name</label>
            <input type="text" name="name" placeholder="e.g. Hour 1" required />
          </div>
          
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Start Time</label>
              <input type="time" name="start_time" required />
            </div>
            <div className={styles.inputGroup}>
              <label>End Time</label>
              <input type="time" name="end_time" required />
            </div>
          </div>
          
          <div className={styles.checkboxGroup}>
            <input type="checkbox" name="is_break" id="is_break" value="true" />
            <label htmlFor="is_break">This slot is a break/interval</label>
          </div>
          
          <button type="submit" className={styles.button}>Add Slot</button>
        </form>
      </div>

      <div className={styles.card}>
        <h2>Current Time Slots</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Name</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {timeSlots?.map((slot, index) => (
                <tr key={slot.id}>
                  <td>{index + 1}</td>
                  <td>{slot.name}</td>
                  <td>{slot.start_time.slice(0, 5)}</td>
                  <td>{slot.end_time.slice(0, 5)}</td>
                  <td>
                    {slot.is_break ? (
                      <span className={styles.badgeBreak}>Break</span>
                    ) : (
                      <span className={styles.badgeClass}>Class Hour</span>
                    )}
                  </td>
                  <td>
                    <form action={deleteTimeSlot}>
                      <input type="hidden" name="id" value={slot.id} />
                      <button type="submit" className={styles.deleteBtn}>Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
              {(!timeSlots || timeSlots.length === 0) && (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>No time slots configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
