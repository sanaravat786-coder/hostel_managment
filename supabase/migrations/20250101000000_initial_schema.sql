/*
          # [Initial Schema Setup]
          This script sets up the initial database schema for the Hostel Management System.

          ## Query Description: [This script creates all necessary tables, relationships, and security policies. It is designed for a fresh database and will fail if these tables already exist. It establishes the core structure for the entire application. It is safe to run on a new project.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "High"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Tables Created: profiles, rooms, students, allocations, fees, payments, visitors, complaints, notices.
          - Triggers Created: on_auth_user_created to populate profiles.
          - RLS Policies: Enabled for all tables with basic security rules.
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: Policies rely on `auth.uid()` and a `role` column in the `profiles` table.
          
          ## Performance Impact:
          - Indexes: Primary and Foreign keys are indexed by default.
          - Triggers: One trigger on `auth.users` for profile creation.
          - Estimated Impact: Low on a new database.
          */

-- PROFILES TABLE
-- Stores public user data and role.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'student',
    status TEXT NOT NULL DEFAULT 'active'
);
COMMENT ON TABLE public.profiles IS 'Stores public user data and role, linked to auth.users.';

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');


-- TRIGGER FOR NEW USER
-- This trigger automatically creates a profile entry when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ROOMS TABLE
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_no TEXT NOT NULL UNIQUE,
    block TEXT NOT NULL,
    type TEXT NOT NULL,
    capacity INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'vacant'
);
COMMENT ON TABLE public.rooms IS 'Manages hostel room information.';

-- Enable RLS for rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view rooms" ON public.rooms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and wardens can manage rooms" ON public.rooms FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'warden')
);


-- STUDENTS TABLE
-- Stores student-specific details, linked to a user profile.
CREATE TABLE public.students (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    course TEXT,
    year INT,
    contact TEXT,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.students IS 'Stores student-specific academic and contact details.';

-- Enable RLS for students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view their own data" ON public.students FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins and wardens can manage students" ON public.students FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'warden')
);


-- ALLOCATIONS TABLE
-- Join table for student-room allocation history.
CREATE TABLE public.allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    date_allocated TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.allocations IS 'Tracks historical room allocations for students.';

-- Enable RLS for allocations
ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view their own allocation history" ON public.allocations FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins and wardens can manage allocations" ON public.allocations FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'warden')
);


-- FEES TABLE
CREATE TABLE public.fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    total_amount NUMERIC NOT NULL,
    paid_amount NUMERIC NOT NULL DEFAULT 0,
    balance NUMERIC GENERATED ALWAYS AS (total_amount - paid_amount) STORED
);
COMMENT ON TABLE public.fees IS 'Manages fee structures for students.';

-- Enable RLS for fees
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view their own fees" ON public.fees FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins and wardens can manage fees" ON public.fees FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'warden')
);


-- PAYMENTS TABLE
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_id UUID NOT NULL REFERENCES public.fees(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    mode TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.payments IS 'Logs individual payment transactions against a fee record.';

-- Enable RLS for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'student' AND 
  fee_id IN (SELECT id FROM fees WHERE student_id = auth.uid())
);
CREATE POLICY "Admins and wardens can manage payments" ON public.payments FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'warden')
);


-- VISITORS TABLE
CREATE TABLE public.visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact TEXT,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    purpose TEXT,
    in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    out_time TIMESTAMPTZ
);
COMMENT ON TABLE public.visitors IS 'Logs visitor entries and exits.';

-- Enable RLS for visitors
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view visitors" ON public.visitors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and wardens can manage visitors" ON public.visitors FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'warden')
);


-- COMPLAINTS TABLE
CREATE TABLE public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    date TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.complaints IS 'Tracks student-submitted complaints.';

-- Enable RLS for complaints
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can manage their own complaints" ON public.complaints FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Admins and wardens can view all complaints" ON public.complaints FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'warden')
);
CREATE POLICY "Admins and wardens can update complaints" ON public.complaints FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'warden')
);


-- NOTICES TABLE
CREATE TABLE public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT,
    date_posted TIMESTAMPTZ NOT NULL DEFAULT now(),
    posted_by UUID REFERENCES public.profiles(id)
);
COMMENT ON TABLE public.notices IS 'Stores announcements and notices.';

-- Enable RLS for notices
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view notices" ON public.notices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and wardens can manage notices" ON public.notices FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'warden')
);
