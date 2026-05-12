import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ulstqggmxlnsjrhounns.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsc3RxZ2dteGxuc2pyaG91bm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzI0MjUsImV4cCI6MjA5MzA0ODQyNX0.7t29MlyyYrFI0MUg0q1f-W8rEPKNZJ53lFyIwx0Xhq4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  // Fetch existing courses and lecturers
  const { data: courses } = await supabase.from('courses').select('*')
  const { data: lecturers } = await supabase.from('lecturers').select('*')
  
  if (courses && courses.length > 0 && lecturers && lecturers.length > 0) {
    const course = courses[0]
    
    // Assign each lecturer to the course to populate course_assignments
    for (const lecturer of lecturers) {
      const { error } = await supabase.from('course_assignments').insert({
        course_id: course.id,
        lecturer_id: lecturer.id,
        semester: 'Semester 1',
        year: 2026,
        session: 'Morning'
      })
      if (error) {
        console.error('Error creating assignment:', error)
      } else {
        console.log(`Assigned ${lecturer.full_name} to ${course.code}`)
      }
    }
  } else {
    console.log('No courses or lecturers found to link.')
  }
}

run()
