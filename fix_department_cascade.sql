-- ============================================
-- Fix Department and Programme FK constraints to CASCADE
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. programmes → departments (CASCADE)
ALTER TABLE public.programmes
  DROP CONSTRAINT IF EXISTS programmes_department_id_fkey;

ALTER TABLE public.programmes
  ADD CONSTRAINT programmes_department_id_fkey
  FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


-- 2. lecturers → departments (CASCADE)
ALTER TABLE public.lecturers
  DROP CONSTRAINT IF EXISTS lecturers_department_id_fkey;

ALTER TABLE public.lecturers
  ADD CONSTRAINT lecturers_department_id_fkey
  FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


-- 3. courses → departments (CASCADE)
ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_department_id_fkey;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_department_id_fkey
  FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


-- 4. student_responses → programmes (CASCADE)
-- (Just in case you try to delete a programme later)
ALTER TABLE public.student_responses
  DROP CONSTRAINT IF EXISTS student_responses_programme_id_fkey;

ALTER TABLE public.student_responses
  ADD CONSTRAINT student_responses_programme_id_fkey
  FOREIGN KEY (programme_id) REFERENCES public.programmes(id) ON DELETE CASCADE;
