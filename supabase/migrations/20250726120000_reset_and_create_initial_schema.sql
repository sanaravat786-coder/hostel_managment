/*
# [Schema Reset and Initial Creation]
This migration script will completely reset the 'public' schema by dropping all existing tables related to the Hostel Management System and then recreating them from scratch. It sets up the entire database structure, including tables for profiles, students, rooms, fees, payments, visitors, complaints, and notices. It also configures authentication triggers and Row Level Security (RLS) policies for data protection.

## Query Description: [This operation is DESTRUCTIVE and will remove all existing data in the application tables to create a new, clean schema. It is designed to provide a fresh start. A backup is strongly recommended before proceeding if you have any data you wish to preserve.]

## Metadata:
- Schema-Category: ["Dangerous"]
- Impact-Level: ["High"]
- Requires-Backup: [true]
- Reversible: [false]

## Structure Details:
- Drops tables: payments, fees, complaints, visitors, notices, students, rooms, profiles.
- Creates tables: profiles, rooms, students, fees, payments, visitors, complaints, notices.
- Creates functions: handle_new_user, is_admin.
- Creates triggers: on_auth_user_created.
- Enables RLS and creates policies for all new tables.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [Requires user authentication for all data access. Defines an 'admin' role with elevated privileges.]

## Performance Impact:
- Indexes: [Adds Primary Key and Foreign Key indexes.]
- Triggers: [Adds a trigger to the auth.users table.]
- Estimated Impact: [Low on a new database. The trigger on user creation is lightweight.]
*/

-- STEP 1: Drop existing objects
-- Drop all tables if they exist to ensure a clean slate.
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.fees CASCADE;
DROP TABLE IF EXISTS public.complaints CASCADE;
DROP TABLE IF EXISTS public.visitors CASCADE;
DROP TABLE IF EXISTS public.notices CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop helper functions if they exist
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.handle_new_user();


-- STEP 2: Create Tables

-- Table for user profiles, extending auth.users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);
COMMENT ON TABLE public.profiles IS 'Stores public-facing user profile information.';

-- Table for hostel rooms
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_no TEXT NOT NULL UNIQUE,
    block TEXT NOT NULL CHECK (block IN ('A', 'B', 'C', 'D')),
    type TEXT NOT NULL CHECK (type IN ('Single', 'Double', 'Triple')),
    capacity INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('occupied', 'vacant', 'maintenance'))
);
COMMENT ON TABLE public.rooms IS 'Manages hostel room information and status.';

-- Table for student-specific details
CREATE TABLE public.students (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    course TEXT,
    year INT,
    contact TEXT,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.students IS 'Stores academic and contact details for students.';

-- Table for managing student fees
CREATE TABLE public.fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    total_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    balance NUMERIC(10, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (status IN ('Paid', 'Partial', 'Unpaid')),
    due_date DATE
);
COMMENT ON TABLE public.fees IS 'Tracks fee status for each student.';

-- Table for individual payment transactions
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_id UUID NOT NULL REFERENCES public.fees(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'Card', 'Online'))
);
COMMENT ON TABLE public.payments IS 'Logs individual payment transactions against a fee record.';

-- Table for visitor logs
CREATE TABLE public.visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact TEXT,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    purpose TEXT,
    in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    out_time TIMESTAMPTZ,
    status TEXT GENERATED ALWAYS AS (CASE WHEN out_time IS NULL THEN 'Inside' ELSE 'Checked Out' END) STORED
);
COMMENT ON TABLE public.visitors IS 'Maintains a log of all visitors.';

-- Table for student complaints
CREATE TABLE public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.complaints IS 'Tracks student complaints and their resolution status.';

-- Table for notices
CREATE TABLE public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    posted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.notices IS 'Stores official notices for all residents.';


-- STEP 3: Create Functions and Triggers

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.is_admin() IS 'Checks if the currently authenticated user has the ''admin'' role.';

-- Function to create a profile for a new user, assigning 'admin' role for a specific email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Assign 'admin' role if the email matches, otherwise use the role from metadata or default to 'student'
  IF NEW.email = 'admin@example.com' THEN
    user_role := 'admin';
  ELSE
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  END IF;

  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a user profile upon new user registration in auth.users.';

-- Trigger to call the function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- STEP 4: Enable Row Level Security (RLS) and Create Policies

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can view rooms" ON public.rooms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage rooms" ON public.rooms FOR ALL USING (public.is_admin());

-- Students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view their own record" ON public.students FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can manage all student records" ON public.students FOR ALL USING (public.is_admin());

-- Fees
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view their own fees" ON public.fees FOR SELECT USING (EXISTS (SELECT 1 FROM public.students WHERE students.id = fees.student_id AND students.id = auth.uid()));
CREATE POLICY "Admins can manage all fees" ON public.fees FOR ALL USING (public.is_admin());

-- Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view their own payments" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.fees JOIN public.students ON fees.student_id = students.id WHERE fees.id = payments.fee_id AND students.id = auth.uid()));
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL USING (public.is_admin());

-- Visitors
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can see their own visitors" ON public.visitors FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins can manage all visitors" ON public.visitors FOR ALL USING (public.is_admin());

-- Complaints
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can manage their own complaints" ON public.complaints FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Admins can manage all complaints" ON public.complaints FOR ALL USING (public.is_admin());

-- Notices
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can view notices" ON public.notices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage notices" ON public.notices FOR ALL USING (public.is_admin());
