/*
# [Security Enhancement] Final Search Path Fix
This migration script explicitly sets the `search_path` for all custom database functions to resolve the "Function Search Path Mutable" security warning. This is a preventative measure to ensure all functions operate in a secure context.

## Query Description: This operation modifies the configuration of existing database functions to enhance security. It does not alter table structures or data. There is no risk of data loss, and the changes are reversible.

## Metadata:
- Schema-Category: ["Safe", "Security"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Functions affected:
  - `get_user_role(uuid)`
  - `handle_new_user()`
  - `delete_user_and_profile()`
  - `get_monthly_fee_summary()`
  - `get_block_occupancy()`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: Admin privileges to alter functions.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. This is a configuration change.
*/

-- Set search_path for all custom functions to mitigate security risks.
ALTER FUNCTION public.get_user_role(user_id uuid) SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.delete_user_and_profile() SET search_path = 'public';
ALTER FUNCTION public.get_monthly_fee_summary() SET search_path = 'public';
ALTER FUNCTION public.get_block_occupancy() SET search_path = 'public';
