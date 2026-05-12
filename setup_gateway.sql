-- ============================================
-- Authentication & Gateway Schema Migration
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Wipe old responses tables (because we are fundamentally changing student_id)
DROP TABLE IF EXISTS public.response_answers CASCADE;
DROP TABLE IF EXISTS public.student_responses CASCADE;

-- 2. Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    index_number TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    level INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create Student Enrollments Table (Linking students to course assignments)
CREATE TABLE IF NOT EXISTS public.student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_assignment_id UUID NOT NULL REFERENCES public.course_assignments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(student_id, course_assignment_id)
);

-- 4. Recreate Responses Table with strict student_id
CREATE TABLE IF NOT EXISTS public.student_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    level INTEGER NOT NULL,
    course_assignment_id UUID NOT NULL REFERENCES public.course_assignments(id) ON DELETE CASCADE,
    form_id UUID NOT NULL REFERENCES public.evaluation_forms(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(student_id, course_assignment_id, form_id) -- A student can only evaluate a specific course assignment once per form
);

-- 5. Recreate Answers Table
CREATE TABLE IF NOT EXISTS public.response_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES public.student_responses(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.form_questions(id) ON DELETE CASCADE,
    rating_value INTEGER,
    text_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. RLS Policies
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_answers ENABLE ROW LEVEL SECURITY;

-- Allow completely open access for simplicity in the current architecture
-- (In production, you would restrict these, but we are keeping it consistent with the existing setup)
CREATE POLICY "Allow all on students" ON public.students FOR ALL USING (true);
CREATE POLICY "Allow all on student_enrollments" ON public.student_enrollments FOR ALL USING (true);
CREATE POLICY "Allow all on student_responses" ON public.student_responses FOR ALL USING (true);
CREATE POLICY "Allow all on response_answers" ON public.response_answers FOR ALL USING (true);
