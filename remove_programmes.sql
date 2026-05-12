-- ============================================
-- Remove Programmes table and update references
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Drop the foreign key from student_responses
ALTER TABLE public.student_responses
  DROP CONSTRAINT IF EXISTS student_responses_programme_id_fkey;

-- 2. Rename programme_id column to department_id in student_responses
ALTER TABLE public.student_responses
  RENAME COLUMN programme_id TO department_id;

-- 3. Add foreign key from student_responses to departments
ALTER TABLE public.student_responses
  ADD CONSTRAINT student_responses_department_id_fkey
  FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;

-- 4. Drop the programmes table completely
DROP TABLE IF EXISTS public.programmes CASCADE;
