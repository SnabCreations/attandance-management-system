import { createClient } from '@/utils/supabase/server'
import styles from './notes.module.css'
import { saveNote, deleteNote } from './actions'

export default async function PersonalNotesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: notes } = await supabase
    .from('user_notes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Personal Notes</h1>
        <p className={styles.subtitle}>A private scratchpad for your thoughts, tasks, and ideas.</p>
      </div>

      <div className={styles.card}>
        <h2>Create a Note</h2>
        <form action={saveNote} className={styles.form}>
          <textarea 
            name="content" 
            placeholder="Write your note here..." 
            className={styles.textarea} 
            rows={4}
            required
          ></textarea>
          <button type="submit" className={styles.button}>Save Note</button>
        </form>
      </div>

      <div className={styles.notesGrid}>
        {notes && notes.length > 0 ? (
          notes.map((note: any) => (
            <div key={note.id} className={styles.noteCard}>
              <p className={styles.noteContent}>{note.note}</p>
              <div className={styles.noteFooter}>
                <span className={styles.noteDate}>
                  {new Date(note.created_at).toLocaleDateString()} {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <form action={deleteNote}>
                  <input type="hidden" name="id" value={note.id} />
                  <button type="submit" className={styles.deleteBtn}>Delete</button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.emptyState}>You don't have any notes yet.</p>
        )}
      </div>
    </div>
  )
}
