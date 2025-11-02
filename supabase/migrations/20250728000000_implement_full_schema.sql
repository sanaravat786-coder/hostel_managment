/*
# [Hostel Management System - Full Schema]
This migration script establishes the complete database schema for the Hostel Management System application. It creates all required tables, sets up relationships, defines helper functions, and implements Row Level Security (RLS) to ensure data privacy and integrity.

## Query Description: This script is foundational and will create a new, comprehensive database structure. It is designed to work with a fresh database and will not preserve any existing data in tables with the same names. It is safe to run on a new project but destructive if you have existing, un-migrated data.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- **Tables Created**: profiles, rooms, students, fee_records, transactions, complaints, notices, visitors.
- **Views Created**: fee_details.
- **Functions Created**: handle_new_user, is_admin, get_monthly_fee_summary, get_block_occupancy, delete_user_and_profile.
- **Triggers Created**: on_auth_user_created, set_timestamp on profiles.

## Security Implications:
- RLS Status: Enabled on all application tables.
- Policy Changes: Yes, policies are created for all tables to restrict access based on user roles (admin, student) and ownership.
- Auth Requirements: Policies rely on `auth.uid()` and a custom `is_admin()` function.

## Performance Impact:
- Indexes: Primary keys and foreign keys are indexed by default.
- Triggers: Triggers are used for creating user profiles and updating timestamps.
- Estimated Impact: Low on a new database. Performance will depend on data volume over time.
*/

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- 2. PROFILES TABLE
-- Stores public-facing user data, linked to auth.users.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'student',
    status TEXT NOT NULL DEFAULT 'active',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Stores public user data, extending auth.users.';

-- 3. ROOMS TABLE
-- Stores information about each room in the hostel.
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_no TEXT NOT NULL UNIQUE,
    block TEXT NOT NULL,
    type TEXT NOT NULL,
    capacity SMALLINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'vacant' -- vacant, occupied, maintenance
);
COMMENT ON TABLE public.rooms IS 'Manages hostel room information.';

-- 4. STUDENTS TABLE
-- Stores student-specific academic and contact information.
CREATE TABLE public.students (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    course TEXT,
    year SMALLINT,
    contact TEXT,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.students IS 'Stores detailed information about students.';

-- 5. FEE RECORDS TABLE
-- Tracks the overall fee status for a student per billing cycle.
CREATE TABLE public.fee_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.fee_records IS 'Tracks fee obligations for students.';

-- 6. TRANSACTIONS TABLE
-- Logs individual payments made against a fee record.
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_record_id UUID NOT NULL REFERENCES public.fee_records(id) ON DELETE CASCADE,
    paid_amount NUMERIC(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode TEXT NOT NULL, -- Cash, Card, Online
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.transactions IS 'Logs individual fee payments.';

-- 7. COMPLAINTS TABLE
-- Manages complaints submitted by students.
CREATE TABLE public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending', -- Pending, In Progress, Resolved
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.complaints IS 'Tracks student complaints and their resolution status.';

-- 8. NOTICES TABLE
-- Stores notices posted by the admin.
CREATE TABLE public.notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    posted_by UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.notices IS 'Stores official notices for all users.';

-- 9. VISITORS TABLE
-- Logs visitor entries and exits.
CREATE TABLE public.visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_name TEXT NOT NULL,
    visitor_contact TEXT,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    purpose TEXT,
    in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    out_time TIMESTAMPTZ
);
COMMENT ON TABLE public.visitors IS 'Logs visitor entries and exits.';

-- 10. AUTOMATIC PROFILE CREATION
-- Function to create a profile when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, status)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    'active'
  );
  RETURN new;
END;
$$;

-- Trigger to execute the function on new user creation.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 11. TIMESTAMP UPDATING FUNCTION
-- Function to automatically update `updated_at` columns.
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
CREATE TRIGGER set_profiles_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE public.set_timestamp();

-- 12. HELPER FUNCTION FOR RLS
-- Checks if the currently authenticated user is an admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER -- Runs as the calling user
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role = 'admin';
END;
$$;

-- 13. ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
-- Profiles
CREATE POLICY "Allow individual read access on profiles" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow individual update access on profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow admin all access on profiles" ON public.profiles FOR ALL USING (is_admin());

-- Rooms
CREATE POLICY "Allow authenticated read access on rooms" ON public.rooms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin all access on rooms" ON public.rooms FOR ALL USING (is_admin());

-- Students
CREATE POLICY "Allow individual read access on students" ON public.students FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow admin all access on students" ON public.students FOR ALL USING (is_admin());

-- Complaints
CREATE POLICY "Allow individual access on complaints" ON public.complaints FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Allow admin all access on complaints" ON public.complaints FOR ALL USING (is_admin());

-- Notices
CREATE POLICY "Allow authenticated read access on notices" ON public.notices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin all access on notices" ON public.notices FOR ALL USING (is_admin());

-- Fee Records & Transactions
CREATE POLICY "Allow individual read access on fee_records" ON public.fee_records FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Allow admin all access on fee_records" ON public.fee_records FOR ALL USING (is_admin());
CREATE POLICY "Allow related user read access on transactions" ON public.transactions FOR SELECT USING (
    auth.uid() IN (SELECT student_id FROM fee_records WHERE id = fee_record_id)
);
CREATE POLICY "Allow admin all access on transactions" ON public.transactions FOR ALL USING (is_admin());

-- Visitors
CREATE POLICY "Allow admin all access on visitors" ON public.visitors FOR ALL USING (is_admin());

-- 14. VIEWS
-- A view to simplify fee calculations.
CREATE OR REPLACE VIEW public.fee_details AS
SELECT
    fr.id,
    fr.student_id,
    p.full_name as student_name,
    fr.total_amount,
    COALESCE(t.paid_amount, 0) as paid_amount,
    (fr.total_amount - COALESCE(t.paid_amount, 0)) as balance,
    CASE
        WHEN (fr.total_amount - COALESCE(t.paid_amount, 0)) <= 0 THEN 'Paid'
        WHEN COALESCE(t.paid_amount, 0) > 0 THEN 'Partial'
        ELSE 'Unpaid'
    END as status,
    fr.created_at
FROM
    public.fee_records fr
JOIN
    public.profiles p ON fr.student_id = p.id
LEFT JOIN
    (SELECT fee_record_id, SUM(paid_amount) as paid_amount FROM public.transactions GROUP BY fee_record_id) t
    ON fr.id = t.fee_record_id;

-- 15. RPC FUNCTIONS
-- Function for dashboard chart: monthly fee summary.
CREATE OR REPLACE FUNCTION public.get_monthly_fee_summary()
RETURNS TABLE(month TEXT, collected NUMERIC, total NUMERIC)
LANGUAGE sql STABLE
AS $$
  SELECT
    to_char(date_trunc('month', fr.created_at), 'Mon YYYY') AS month,
    SUM(COALESCE((SELECT SUM(paid_amount) FROM public.transactions WHERE fee_record_id = fr.id), 0)) AS collected,
    SUM(fr.total_amount) AS total
  FROM public.fee_records fr
  WHERE fr.created_at > NOW() - INTERVAL '6 months'
  GROUP BY date_trunc('month', fr.created_at)
  ORDER BY date_trunc('month', fr.created_at) ASC;
$$;

-- Function for dashboard chart: room occupancy by block.
CREATE OR REPLACE FUNCTION public.get_block_occupancy()
RETURNS TABLE(block TEXT, occupied BIGINT, total BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT
    r.block,
    COUNT(CASE WHEN r.status = 'occupied' THEN 1 END) AS occupied,
    COUNT(r.id) AS total
  FROM public.rooms r
  GROUP BY r.block
  ORDER BY r.block;
$$;

-- Function to safely delete a user and all their related data.
CREATE OR REPLACE FUNCTION public.delete_user_and_profile(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete users.';
  END IF;
  
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- 16. INITIAL DATA SEEDING
-- Seed some rooms to make the application usable from the start.
INSERT INTO public.rooms (room_no, block, type, capacity, status) VALUES
('101', 'A', 'Single', 1, 'vacant'),
('102', 'A', 'Double', 2, 'vacant'),
('201', 'B', 'Double', 2, 'vacant'),
('202', 'B', 'Triple', 3, 'vacant'),
('301', 'C', 'Single', 1, 'vacant');
