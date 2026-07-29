import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  const announcements = [
    {
      title: "Welcome to Fall Semester",
      content: "Welcome all Mechanical Engineering students to the new semester! Let's make it a great one.",
      target_audience: "all"
    },
    {
      title: "Library Timings Updated",
      content: "The central library will now remain open until 8 PM on weekdays.",
      target_audience: "all"
    },
    {
      title: "Sports Meet Registration",
      content: "Register for the annual inter-department sports meet before Friday.",
      target_audience: "all"
    }
  ]
  
  const { error } = await supabase.from('announcements').insert(announcements)
  if (error) console.error("Error seeding public announcements:", error)
  else console.log("Public announcements seeded successfully")
}
seed()
