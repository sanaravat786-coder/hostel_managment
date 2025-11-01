/*
# [Security and Cleanup Operations]
This migration script addresses the final security advisory by setting a fixed `search_path` for the `get_user_role` function. It also introduces a new function and trigger to ensure that when a user is deleted from the `auth.users` table, their corresponding records in `profiles` and other related tables are also cleanly removed, maintaining data integrity.

## Query Description:
- **ALTER FUNCTION get_user_role**: Sets a non-mutable search path to mitigate security risks. This is a safe, non-destructive operation.
- **CREATE FUNCTION handle_delete_user**: Creates a trigger function that automatically deletes a user's profile when they are removed from `auth.users`.
- **CREATE TRIGGER on_user_deleted**: Creates the trigger that executes `handle_delete_user` after a user is deleted.
- **CREATE FUNCTION delete_user_and_profile**: Creates a new security definer function that allows authorized users (admins) to delete a user from `auth.users`. This is a destructive operation but is controlled by the function's internal role check.

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Modifies: `public.get_user_role` function.
- Adds: `public.handle_delete_user` function, `on_user_deleted` trigger on `auth.users`, `public.delete_user_and_profile` function.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: No
- Auth Requirements: The new `delete_user_and_profile` function is protected by an internal role check, ensuring only admins can execute it.
- Mitigates `search_path` vulnerability.

## Performance Impact:
- Indexes: None
- Triggers: Adds a new trigger on `auth.users` delete operations. The impact is minimal as user deletion is an infrequent event.
- Estimated Impact: Low
*/

-- 1. Fix search path for get_user_role function
ALTER FUNCTION public.get_user_role()
SET search_path = public;


-- 2. Create a trigger function to automatically delete a profile when a user is deleted.
CREATE OR REPLACE FUNCTION public.handle_delete_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Use definer to have permissions to delete from public.profiles
SET search_path = public
AS $$
BEGIN
  -- Delete the corresponding profile
  DELETE FROM public.profiles WHERE id = old.id;
  RETURN old;
END;
$$;

-- 3. Create the trigger on the auth.users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_user_deleted'
  ) THEN
    CREATE TRIGGER on_user_deleted
      AFTER DELETE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_delete_user();
  END IF;
END
$$;


-- 4. Create a function that admins can call to delete a user
CREATE OR REPLACE FUNCTION public.delete_user_and_profile(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF get_user_role(auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete users.';
  END IF;

  -- Delete the user from auth.users. The trigger will handle profile deletion.
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;
