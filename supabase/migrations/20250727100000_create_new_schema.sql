-- 1. Drop existing objects to start fresh
DROP VIEW IF EXISTS public.fee_details;
DROP FUNCTION IF EXISTS public.delete_user_and_profile(uuid);
DROP FUNCTION IF EXISTS public.get_block_occupancy();
DROP FUNCTION IF EXISTS public.get_monthly_fee_summary();
DROP TRIGGER IF EXISTS on_transaction_change on public.transactions;
DROP FUNCTION IF EXISTS public.update_fee_record_status();
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.fee_records;
DROP TABLE IF EXISTS public.notices;
DROP TABLE IF EXISTS public.visitors;
DROP TABLE IF EXISTS public.complaints;
DROP TABLE IF EXISTS public.students;
DROP TABLE IF EXISTS public.rooms;
DROP TRIGGER IF EXISTS on_auth_user_created on auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.profiles;

-- 2. Profiles Table (linked to auth.users)
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    role text NOT NULL DEFAULT 'student',
    status text NOT NULL DEFAULT 'active',
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT role_check CHECK (role IN ('admin', 'student')),
    CONSTRAINT status_check CHECK (status IN ('active', 'inactive'))
);
COMMENT ON TABLE public.profiles IS 'Profile data for authenticated users.';

-- 3. Rooms Table
CREATE TABLE public.rooms (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    room_no text NOT NULL,
    block text NOT NULL,
    type text NOT NULL,
    capacity smallint NOT NULL,
    status text NOT NULL DEFAULT 'vacant',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (room_no, block),
    CONSTRAINT room_status_check CHECK (status IN ('vacant', 'occupied', 'maintenance'))
);
COMMENT ON TABLE public.rooms IS 'Stores information about hostel rooms.';

-- 4. Students Table
CREATE TABLE public.students (
    id uuid NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
    course text,
    year smallint,
    contact text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.students IS 'Stores student-specific information.';

-- 5. Fee Records Table
CREATE TABLE public.fee_records (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    description text NOT NULL,
    total_amount numeric(10, 2) NOT NULL,
    due_date date,
    status text NOT NULL DEFAULT 'Unpaid',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT fee_status_check CHECK (status IN ('Unpaid', 'Partial', 'Paid'))
);
COMMENT ON TABLE public.fee_records IS 'Defines fee obligations for students.';

-- 6. Transactions Table
CREATE TABLE public.transactions (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_record_id uuid NOT NULL REFERENCES public.fee_records(id) ON DELETE CASCADE,
    paid_amount numeric(10, 2) NOT NULL,
    payment_date date NOT NULL,
    payment_mode text,
    recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.transactions IS 'Logs individual payments against fee records.';

-- 7. Complaints Table
CREATE TABLE public.complaints (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'Pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT complaint_status_check CHECK (status IN ('Pending', 'In Progress', 'Resolved'))
);
COMMENT ON TABLE public.complaints IS 'Stores student complaints.';

-- 8. Visitors Table
CREATE TABLE public.visitors (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    visitor_name text NOT NULL,
    visitor_contact text,
    purpose text,
    in_time timestamptz NOT NULL DEFAULT now(),
    out_time timestamptz,
    created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.visitors IS 'Logs visitor entries and exits.';

-- 9. Notices Table
CREATE TABLE public.notices (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    posted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    title text NOT NULL,
    message text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.notices IS 'Stores official notices for residents.';

-- 10. Triggers and Functions

-- Function to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'role');
  RETURN NEW;
END;
$$;

-- Trigger to call handle_new_user on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update 'updated_at' column
CREATE EXTENSION IF NOT EXISTS moddatetime;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Apply 'updated_at' trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_fee_records_updated_at BEFORE UPDATE ON public.fee_records FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON public.notices FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Function and trigger to update fee_record status based on transactions
CREATE OR REPLACE FUNCTION public.update_fee_record_status()
RETURNS TRIGGER AS $$
DECLARE
  record_id uuid;
  total_paid numeric;
  total_due numeric;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    record_id := OLD.fee_record_id;
  ELSE
    record_id := NEW.fee_record_id;
  END IF;

  SELECT total_amount INTO total_due FROM public.fee_records WHERE id = record_id;
  SELECT COALESCE(SUM(paid_amount), 0) INTO total_paid FROM public.transactions WHERE fee_record_id = record_id;

  IF total_paid >= total_due THEN
    UPDATE public.fee_records SET status = 'Paid', updated_at = now() WHERE id = record_id;
  ELSIF total_paid > 0 THEN
    UPDATE public.fee_records SET status = 'Partial', updated_at = now() WHERE id = record_id;
  ELSE
    UPDATE public.fee_records SET status = 'Unpaid', updated_at = now() WHERE id = record_id;
  END IF;

  RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.update_fee_record_status();

-- 11. Views for simplified data access

CREATE OR REPLACE VIEW public.fee_details AS
SELECT
  fr.id,
  fr.student_id,
  p.full_name AS student_name,
  fr.description,
  fr.total_amount,
  fr.due_date,
  COALESCE(t.paid, 0) AS paid_amount,
  (fr.total_amount - COALESCE(t.paid, 0)) AS balance,
  CASE
    WHEN (fr.total_amount - COALESCE(t.paid, 0)) <= 0 THEN 'Paid'
    WHEN COALESCE(t.paid, 0) > 0 AND (fr.total_amount - COALESCE(t.paid, 0)) > 0 THEN 'Partial'
    ELSE 'Unpaid'
  END AS status,
  fr.created_at
FROM
  public.fee_records fr
JOIN
  public.profiles p ON fr.student_id = p.id
LEFT JOIN
  (SELECT fee_record_id, SUM(paid_amount) AS paid FROM public.transactions GROUP BY fee_record_id) t
ON fr.id = t.fee_record_id;

-- 12. RPC Functions for the application

CREATE OR REPLACE FUNCTION public.get_block_occupancy()
RETURNS TABLE(block text, total bigint, occupied bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.block,
    COUNT(r.id) AS total,
    COUNT(r.id) FILTER (WHERE r.status = 'occupied') AS occupied
  FROM public.rooms r
  GROUP BY r.block
  ORDER BY r.block;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.get_monthly_fee_summary()
RETURNS TABLE(month text, total numeric, collected numeric) AS $$
BEGIN
    RETURN QUERY
    WITH months AS (
        SELECT TO_CHAR(date_trunc('month', m), 'Mon YYYY') AS month
        FROM generate_series(
            date_trunc('month', now()) - interval '5 months',
            date_trunc('month', now()),
            '1 month'
        ) AS m
    ),
    dues AS (
        SELECT
            TO_CHAR(date_trunc('month', due_date), 'Mon YYYY') AS month,
            SUM(total_amount) AS total
        FROM public.fee_records
        GROUP BY 1
    ),
    payments AS (
        SELECT
            TO_CHAR(date_trunc('month', payment_date), 'Mon YYYY') AS month,
            SUM(paid_amount) AS collected
        FROM public.transactions
        GROUP BY 1
    )
    SELECT
        m.month,
        COALESCE(d.total, 0) AS total,
        COALESCE(p.collected, 0) AS collected
    FROM months m
    LEFT JOIN dues d ON m.month = d.month
    LEFT JOIN payments p ON m.month = p.month
    ORDER BY to_date(m.month, 'Mon YYYY');
END;
$$ LANGUAGE plpgsql STABLE;


CREATE OR REPLACE FUNCTION public.delete_user_and_profile(user_id_to_delete uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$;

-- 13. Row Level Security (RLS) Policies

-- Helper function to get user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Policies for 'profiles'
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles." ON public.profiles FOR ALL USING (get_my_role() = 'admin');

-- Policies for 'rooms'
CREATE POLICY "Authenticated users can view rooms." ON public.rooms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage rooms." ON public.rooms FOR ALL USING (get_my_role() = 'admin');

-- Policies for 'students'
CREATE POLICY "Students can view their own data." ON public.students FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can manage all student data." ON public.students FOR ALL USING (get_my_role() = 'admin');

-- Policies for 'fee_records'
CREATE POLICY "Students can view their own fee records." ON public.fee_records FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins can manage all fee records." ON public.fee_records FOR ALL USING (get_my_role() = 'admin');

-- Policies for 'transactions'
CREATE POLICY "Students can view their own transactions." ON public.transactions FOR SELECT USING (EXISTS (SELECT 1 FROM fee_records WHERE id = fee_record_id AND student_id = auth.uid()));
CREATE POLICY "Admins can manage all transactions." ON public.transactions FOR ALL USING (get_my_role() = 'admin');

-- Policies for 'complaints'
CREATE POLICY "Students can manage their own complaints." ON public.complaints FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Admins can manage all complaints." ON public.complaints FOR ALL USING (get_my_role() = 'admin');

-- Policies for 'visitors'
CREATE POLICY "Students can view their own visitors." ON public.visitors FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins can manage all visitors." ON public.visitors FOR ALL USING (get_my_role() = 'admin');

-- Policies for 'notices'
CREATE POLICY "Authenticated users can view notices." ON public.notices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage notices." ON public.notices FOR ALL USING (get_my_role() = 'admin');
