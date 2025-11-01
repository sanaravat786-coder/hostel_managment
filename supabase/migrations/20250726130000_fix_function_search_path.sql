/*
# [Fix Function Search Path]
[This migration updates existing functions to set a secure search_path, mitigating potential security risks as flagged by security advisories.]

## Query Description: [This operation modifies the `get_user_role` and `handle_new_user` functions to explicitly set the `search_path`. This is a security best practice to prevent hijacking attacks by ensuring functions do not use a mutable search path. It has no impact on existing data and is a safe, reversible change.]

## Metadata:
- Schema-Category: ["Safe", "Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Functions affected: `get_user_role`, `handle_new_user`

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [N/A]
- Mitigates: [Function search path hijacking (WARN)]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [None]
*/

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id, full_name, role, status)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'student')::public.user_role,
    'active'
  );

  -- If the new user is an admin, set their role in auth.users metadata
  IF new.email = 'admin@example.com' THEN
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'
    WHERE id = new.id;
  END IF;
  
  RETURN new;
END;
$$;
