/*
# [Fix Security Advisories]
This migration addresses critical and warning-level security advisories identified in the project. It modifies existing views to use `SECURITY INVOKER` and sets a fixed `search_path` for functions to mitigate potential security risks.

## Query Description:
This operation alters two views and two functions to enhance security.
- **Views**: The `fee_details` and `student_details` views will be changed from `SECURITY DEFINER` to `SECURITY INVOKER`. This ensures that Row-Level Security (RLS) policies are enforced based on the permissions of the user querying the view, not the user who created it. This is a critical security enhancement.
- **Functions**: The `get_monthly_fee_summary` and `get_block_occupancy` functions will be updated to have a fixed `search_path`. This prevents potential hijacking by malicious users who might alter the search path to execute unintended functions.

There is no risk of data loss with this operation. It only modifies the security behavior of existing database objects.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- **Views Modified**: `public.fee_details`, `public.student_details`
- **Functions Modified**: `public.get_monthly_fee_summary`, `public.get_block_occupancy`

## Security Implications:
- RLS Status: This change correctly enforces RLS on the affected views.
- Policy Changes: No.
- Auth Requirements: Queries to these views will now correctly respect the authenticated user's RLS policies.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible performance impact. The primary change is to security enforcement.
*/

-- ========== Fix Security Definer Views ==========
-- Alter fee_details view to use SECURITY INVOKER
CREATE OR REPLACE VIEW public.fee_details
WITH (security_invoker = true) AS
SELECT
  fr.id,
  s.id AS student_id,
  p.full_name AS student_name,
  fr.total_amount,
  COALESCE(t.total_paid, 0) AS paid_amount,
  (fr.total_amount - COALESCE(t.total_paid, 0)) AS balance,
  CASE
    WHEN (fr.total_amount - COALESCE(t.total_paid, 0)) <= 0 THEN 'Paid'::text
    WHEN COALESCE(t.total_paid, 0) > 0 THEN 'Partial'::text
    ELSE 'Unpaid'::text
  END AS status,
  fr.created_at
FROM
  public.fee_records fr
  JOIN public.students s ON fr.student_id = s.id
  JOIN public.profiles p ON s.id = p.id
  LEFT JOIN (
    SELECT
      fee_record_id,
      SUM(paid_amount) AS total_paid
    FROM
      public.transactions
    GROUP BY
      fee_record_id
  ) t ON fr.id = t.fee_record_id;

-- Alter student_details view to use SECURITY INVOKER
CREATE OR REPLACE VIEW public.student_details
WITH (security_invoker = true) AS
SELECT
  s.id,
  p.full_name,
  p.email,
  p.status,
  s.course,
  s.year,
  s.contact,
  s.room_id,
  r.room_no
FROM
  public.students s
  JOIN public.profiles p ON s.id = p.id
  LEFT JOIN public.rooms r ON s.room_id = r.id;


-- ========== Fix Function Search Path ==========
-- Secure the get_monthly_fee_summary function
CREATE OR REPLACE FUNCTION public.get_monthly_fee_summary()
RETURNS TABLE(month text, total numeric, collected numeric)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(m.month, 'YYYY-MM') AS month,
    COALESCE(SUM(fr.total_amount), 0) AS total,
    COALESCE(SUM(t.paid_amount), 0) AS collected
  FROM
    (SELECT generate_series(
        date_trunc('month', now()) - interval '5 months',
        date_trunc('month', now()),
        '1 month'
      )::date AS month
    ) m
    LEFT JOIN fee_records fr ON date_trunc('month', fr.created_at) = m.month
    LEFT JOIN transactions t ON fr.id = t.fee_record_id
  GROUP BY
    m.month
  ORDER BY
    m.month;
END;
$$;

-- Secure the get_block_occupancy function
CREATE OR REPLACE FUNCTION public.get_block_occupancy()
RETURNS TABLE(block text, occupied bigint, total bigint)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.block,
    COUNT(CASE WHEN r.status = 'occupied' THEN 1 END) AS occupied,
    COUNT(r.id) AS total
  FROM
    rooms r
  GROUP BY
    r.block
  ORDER BY
    r.block;
END;
$$;
