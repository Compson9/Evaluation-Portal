export type Department = {
  id: string
  name: string
  code: string
  created_at: string
}



export type Lecturer = {
  id: string
  full_name: string
  title: string | null
  department_id: string
  created_at: string
}

export type Course = {
  id: string
  code: string
  title: string
  level: number
  department_id: string
  created_at: string
}

export type CourseAssignment = {
  id: string
  lecturer_id: string
  course_id: string
  semester: string
  year: number
  session: 'Morning' | 'Afternoon' | 'Evening' | 'Weekend'
  created_at: string
}

export type QAUser = {
  id: string
  email: string
  password_hash: string
  full_name: string
  created_at: string
}

export type EvaluationForm = {
  id: string
  title: string
  created_by: string
  is_active: boolean
  created_at: string
}

export type FormQuestion = {
  id: string
  form_id: string
  section: string
  question_text: string
  question_type: 'rating' | 'text'
  order_index: number
  created_at: string
}

export type Student = {
  id: string
  index_number: string
  full_name: string
  department_id: string
  level: number
  created_at: string
}

export type StudentEnrollment = {
  id: string
  student_id: string
  course_assignment_id: string
  created_at: string
}

export type StudentResponse = {
  id: string
  student_id: string
  department_id: string
  level: number
  course_assignment_id: string
  form_id: string
  submitted_at: string
}

export type ResponseAnswer = {
  id: string
  response_id: string
  question_id: string
  rating_value: number | null
  text_value: string | null
  created_at: string
}