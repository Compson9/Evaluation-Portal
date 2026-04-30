-- Run this in your Supabase SQL Editor to enforce that a student
-- can only submit ONE evaluation per course assignment for a given form.

-- This creates a unique constraint on the combination of student_id, course_assignment_id, and form_id
ALTER TABLE public.student_responses 
ADD CONSTRAINT unique_student_course_submission 
UNIQUE (student_id, course_assignment_id, form_id);
