-- ============================================
-- Fix RLS policies to allow delete operations
-- Run this in the Supabase SQL Editor
-- ============================================

-- Option A: If you want to KEEP RLS enabled but allow deletes
-- (This allows anyone with the anon key to delete - suitable for admin-only apps)

-- Lecturers
CREATE POLICY "Allow delete on lecturers" ON public.lecturers
  FOR DELETE USING (true);

-- Course Assignments
CREATE POLICY "Allow delete on course_assignments" ON public.course_assignments
  FOR DELETE USING (true);

-- Departments
CREATE POLICY "Allow delete on departments" ON public.departments
  FOR DELETE USING (true);

-- Programmes
CREATE POLICY "Allow delete on programmes" ON public.programmes
  FOR DELETE USING (true);

-- Courses
CREATE POLICY "Allow delete on courses" ON public.courses
  FOR DELETE USING (true);

-- Evaluation Forms
CREATE POLICY "Allow delete on evaluation_forms" ON public.evaluation_forms
  FOR DELETE USING (true);

-- ============================================
-- Option B: If you want to DISABLE RLS entirely (simpler, less secure)
-- Uncomment the lines below instead of using Option A
-- ============================================
-- ALTER TABLE public.lecturers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.course_assignments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.programmes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.evaluation_forms DISABLE ROW LEVEL SECURITY;
