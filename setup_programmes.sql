-- SQL script to create the programmes table in Supabase
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.programmes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- If you previously enabled Row Level Security (RLS) and want to remove it, you can run:
-- ALTER TABLE public.programmes DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- Example: How to add a Programme via SQL
-- ==========================================
-- Insert a dummy department first if you don't have one:
-- INSERT INTO public.departments (id, name, code) VALUES ('a1b2c3d4-e5f6-7890-1234-56789abcdef0', 'Computer Science Dept', 'CSD');
--
-- Then insert a programme:
-- INSERT INTO public.programmes (name, code, department_id) 
-- VALUES ('BSc Computer Science', 'CS-BSC', 'a1b2c3d4-e5f6-7890-1234-56789abcdef0');

-- Note: Ensure that the 'student_responses' table already has the 'programme_id' column:
-- ALTER TABLE public.student_responses ADD COLUMN IF NOT EXISTS programme_id UUID REFERENCES public.programmes(id);
