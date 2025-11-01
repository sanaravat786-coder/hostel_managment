/*
# [Function Security & Dashboard Analytics Update]
This migration secures existing functions by setting an explicit search_path and adds new RPC functions to provide analytics data for the admin dashboard.

## Query Description: This operation modifies `get_user_role` and `handle_new_user` to prevent search path hijacking vulnerabilities. It also introduces `get_monthly_fee_summary` and `get_block_occupancy` to efficiently query aggregated data for dashboard charts. These changes are safe and do not affect existing data.

## Metadata:
- Schema-Category: ["Safe", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Functions `get_user_role` and `handle_new_user` will be updated.
- New RPC functions `get_monthly_fee_summary` and `get_block_occupancy` will be created.

## Security Implications:
- RLS Status: Not changed
- Policy Changes: No
- Auth Requirements: None
- Mitigates: Search path hijacking (resolves "Function Search Path Mutable" warnings).

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Low. Improves dashboard loading performance by aggregating data on the server.
*/

-- Secure the get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS TEXT AS $$
DECLARE
  role TEXT;
BEGIN
  SELECT r.role_name INTO role
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id;
  RETURN role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Secure the handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id, full_name, status)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'active');

  -- Assign role based on email or default to 'student'
  IF new.email = 'admin@example.com' THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (new.id, (SELECT id FROM public.roles WHERE role_name = 'admin'));
  ELSE
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (new.id, (SELECT id FROM public.roles WHERE role_name = 'student'));
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- RPC function for monthly fee summary
CREATE OR REPLACE FUNCTION get_monthly_fee_summary()
RETURNS TABLE(month TEXT, collected NUMERIC, total NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(date_trunc('month', f.created_at), 'Mon') AS month,
    SUM(f.paid_amount) AS collected,
    SUM(f.total_amount) AS total
  FROM
    public.fees f
  WHERE
    f.created_at >= date_trunc('month', now()) - interval '5 months' -- Last 6 months
  GROUP BY
    date_trunc('month', f.created_at)
  ORDER BY
    date_trunc('month', f.created_at);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;


-- RPC function for block occupancy
CREATE OR REPLACE FUNCTION get_block_occupancy()
RETURNS TABLE(block TEXT, occupied BIGINT, total BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.block,
    COUNT(CASE WHEN r.status = 'occupied' THEN 1 END) AS occupied,
    COUNT(*) AS total
  FROM
    public.rooms r
  GROUP BY
    r.block
  ORDER BY
    r.block;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
