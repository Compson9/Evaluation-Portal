-- ============================================
-- Fix FK constraints to CASCADE on delete
-- Run this in the Supabase SQL Editor
-- ============================================
-- This ensures that when you delete a lecturer or course,
-- all related records (assignments, responses, answers) 
-- are automatically cleaned up by PostgreSQL.

-- 1. response_answers → student_responses (CASCADE)
ALTER TABLE public.response_answers
  DROP CONSTRAINT IF EXISTS response_answers_response_id_fkey;

ALTER TABLE public.response_answers
  ADD CONSTRAINT response_answers_response_id_fkey
  FOREIGN KEY (response_id) REFERENCES public.student_responses(id) ON DELETE CASCADE;

-- 2. student_responses → course_assignments (CASCADE)
ALTER TABLE public.student_responses
  DROP CONSTRAINT IF EXISTS student_responses_course_assignment_id_fkey;

ALTER TABLE public.student_responses
  ADD CONSTRAINT student_responses_course_assignment_id_fkey
  FOREIGN KEY (course_assignment_id) REFERENCES public.course_assignments(id) ON DELETE CASCADE;

-- 3. course_assignments → lecturers (CASCADE)
ALTER TABLE public.course_assignments
  DROP CONSTRAINT IF EXISTS course_assignments_lecturer_id_fkey;

ALTER TABLE public.course_assignments
  ADD CONSTRAINT course_assignments_lecturer_id_fkey
  FOREIGN KEY (lecturer_id) REFERENCES public.lecturers(id) ON DELETE CASCADE;

-- 4. course_assignments → courses (CASCADE)
ALTER TABLE public.course_assignments
  DROP CONSTRAINT IF EXISTS course_assignments_course_id_fkey;

ALTER TABLE public.course_assignments
  ADD CONSTRAINT course_assignments_course_id_fkey
  FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- 5. student_responses → evaluation_forms (CASCADE)
ALTER TABLE public.student_responses
  DROP CONSTRAINT IF EXISTS student_responses_form_id_fkey;

ALTER TABLE public.student_responses
  ADD CONSTRAINT student_responses_form_id_fkey
  FOREIGN KEY (form_id) REFERENCES public.evaluation_forms(id) ON DELETE CASCADE;

-- 6. form_questions → evaluation_forms (CASCADE)
ALTER TABLE public.form_questions
  DROP CONSTRAINT IF EXISTS form_questions_form_id_fkey;

ALTER TABLE public.form_questions
  ADD CONSTRAINT form_questions_form_id_fkey
  FOREIGN KEY (form_id) REFERENCES public.evaluation_forms(id) ON DELETE CASCADE;
