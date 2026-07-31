import { createClient } from '@/utils/supabase/server'
import QuestionPapersClient from './QuestionPapersClient'

export default async function QuestionPapersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch roles
  const { data: userProfile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()
    
  const roles = userProfile?.roles || []
  const isFacultyOrAdmin = roles.includes('Admin') || roles.includes('Faculty')

  // Fetch initial data
  const { data: subjects } = await supabase.from('subjects').select('id, name').order('name')
  const { data: semesters } = await supabase.from('semesters').select('id, name').order('name')
  
  const { data: questionPapers } = await supabase
    .from('question_papers')
    .select(`
      id,
      title,
      drive_link,
      created_at,
      subjects(name),
      semesters(name)
    `)
    .order('created_at', { ascending: false })

  return (
    <QuestionPapersClient 
      initialPapers={questionPapers || []}
      subjects={subjects || []}
      semesters={semesters || []}
      isFacultyOrAdmin={isFacultyOrAdmin}
    />
  )
}
