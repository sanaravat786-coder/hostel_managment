/*
# [Fix] Function Redefinition Error

This script resolves a "cannot change return type" error by explicitly dropping and recreating all custom database functions. This ensures a clean state and applies the latest security best practices.

## Query Description:
This operation will safely remove and then re-add several custom functions. There is no risk to existing data as these are helper functions for reading or managing data, not storing it. This also sets a secure `search_path` for all functions to resolve the final security advisory.

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Drops and recreates 5 functions in the `public` schema.
- Drops and recreates 1 trigger on the `auth.users` table.

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: Admin privileges to run migrations.
- Sets `search_path` on all functions to mitigate security warnings.

## Performance Impact:
- Indexes: None
- Triggers: Recreated
- Estimated Impact: Negligible. A one-time redefinition of small functions.
*/

-- Drop existing functions and trigger to allow for re-creation with updated signatures/definitions
DROP FUNCTION IF EXISTS public.get_monthly_fee_summary();
DROP FUNCTION IF EXISTS public.get_block_occupancy();
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.delete_user_and_profile(uuid);
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate function to get monthly fee summary
CREATE OR REPLACE FUNCTION public.get_monthly_fee_summary()
RETURNS TABLE(month text, total numeric, collected numeric)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(m.month, 'Mon YYYY') AS month,
    COALESCE(SUM(f.total_amount), 0) AS total,
    COALESCE(SUM(f.paid_amount), 0) AS collected
  FROM
    generate_series(
      date_trunc('month', NOW() - interval '5 months'),
      date_trunc('month', NOW()),
      '1 month'
    ) AS m(month)
  LEFT JOIN
    public.fees f ON date_trunc('month', f.created_at) = m.month
  GROUP BY
    m.month
  ORDER BY
    m.month;
END;
$$;
ALTER FUNCTION public.get_monthly_fee_summary() SET search_path = public;


-- Recreate function to get block occupancy
CREATE OR REPLACE FUNCTION public.get_block_occupancy()
RETURNS TABLE(block text, total bigint, occupied bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.block,
    COUNT(r.id) AS total,
    COUNT(r.id) FILTER (WHERE r.status = 'occupied') AS occupied
  FROM
    public.rooms r
  GROUP BY
    r.block
  ORDER BY
    r.block;
END;
$$;
ALTER FUNCTION public.get_block_occupancy() SET search_path = public;


-- Recreate function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'anon';
  ELSE
    RETURN (
      SELECT raw_user_meta_data->>'role'
      FROM auth.users
      WHERE id = auth.uid()
    );
  END IF;
END;
$$;
ALTER FUNCTION public.get_user_role() SET search_path = public;


-- Recreate function to delete user and their profile
CREATE OR REPLACE FUNCTION public.delete_user_and_profile(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete from related tables first
  DELETE FROM public.fees WHERE student_id = user_id;
  DELETE FROM public.complaints WHERE student_id = user_id;
  DELETE FROM public.visitors WHERE student_id = user_id;
  
  -- Unset room if student is assigned to one
  UPDATE public.rooms SET status = 'vacant' WHERE id = (SELECT room_id FROM public.students WHERE id = user_id);
  
  -- Delete the student record
  DELETE FROM public.students WHERE id = user_id;
  
  -- Delete the public profile
  DELETE FROM public.profiles WHERE id = user_id;
  
  -- Finally, delete the user from auth.users
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;
ALTER FUNCTION public.delete_user_and_profile(uuid) SET search_path = public;


-- Recreate trigger function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, status)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'role',
    'active'
  );
  RETURN new;
END;
$$;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Re-apply the trigger to the auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
