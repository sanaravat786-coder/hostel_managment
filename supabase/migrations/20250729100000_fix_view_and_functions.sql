/*
# [Fix] Correct View Definition and Function Security
This migration script corrects an error in a view definition and improves security by setting a fixed search_path for several database functions.

## Query Description: 
This operation will replace a faulty view and update existing functions. It is a safe operation and will not impact any existing data. It is designed to fix the error you encountered and resolve security warnings.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Replaces the `public.fee_details` view.
- Alters the following functions to set a secure search_path:
  - `public.handle_new_user()`
  - `public.delete_user_and_profile(uuid)`
  - `public.get_monthly_fee_summary()`
  - `public.get_block_occupancy()`
*/

-- Drop the faulty view if it exists
DROP VIEW IF EXISTS public.fee_details;

-- Recreate the fee_details view with the correct structure and SECURITY INVOKER
CREATE OR REPLACE VIEW public.fee_details WITH (security_invoker=true) AS
SELECT
    fr.id,
    s.id as student_id,
    p.full_name as student_name,
    fr.total_amount,
    COALESCE(t.paid_amount, 0) as paid_amount,
    fr.total_amount - COALESCE(t.paid_amount, 0) as balance,
    CASE
        WHEN COALESCE(t.paid_amount, 0) >= fr.total_amount THEN 'Paid'::text
        WHEN COALESCE(t.paid_amount, 0) > 0 THEN 'Partial'::text
        ELSE 'Unpaid'::text
    END as status,
    fr.created_at
FROM
    public.fee_records fr
JOIN
    public.students s ON fr.student_id = s.id
JOIN
    public.profiles p ON s.id = p.id
LEFT JOIN
    (SELECT fee_record_id, SUM(paid_amount) as paid_amount FROM public.transactions GROUP BY fee_record_id) t
ON fr.id = t.fee_record_id;

-- Secure the handle_new_user function
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Secure the delete_user_and_profile function
ALTER FUNCTION public.delete_user_and_profile(user_id uuid) SET search_path = public;

-- Secure the get_monthly_fee_summary function
ALTER FUNCTION public.get_monthly_fee_summary() SET search_path = public;

-- Secure the get_block_occupancy function
ALTER FUNCTION public.get_block_occupancy() SET search_path = public;
