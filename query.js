import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ulstqggmxlnsjrhounns.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsc3RxZ2dteGxuc2pyaG91bm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzI0MjUsImV4cCI6MjA5MzA0ODQyNX0.7t29MlyyYrFI0MUg0q1f-W8rEPKNZJ53lFyIwx0Xhq4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data: progs, error: pErr } = await supabase.from('programmes').select('*')
  console.log('Programmes:', progs?.length, pErr)
  
  const { data: lecs, error: lErr } = await supabase.from('lecturers').select('*')
  console.log('Lecturers:', lecs?.length, lErr)
  
  const { data: courses, error: cErr } = await supabase.from('courses').select('*')
  console.log('Courses:', courses?.length, cErr)
  
  const { data: assigns, error: aErr } = await supabase.from('course_assignments').select(`
    id,
    semester,
    year,
    session,
    courses ( code, title, level ),
    lecturers ( full_name, title )
  `)
  console.log('Assignments:', assigns?.length, aErr)
  if (assigns?.length) console.log(assigns[0])
}

run()
