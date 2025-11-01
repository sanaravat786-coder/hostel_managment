/*
          # [Function] Recreate user deletion function
          [This function securely deletes a user and their associated profile data, fixing the "function does not exist" error.]

          ## Query Description: [This operation creates a `security definer` function that allows an admin to delete a user from the `auth.users` table. It includes a check to ensure only users with the 'admin' role can execute it. It also sets a secure `search_path` to prevent potential hijacking vulnerabilities.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Security"]
          - Impact-Level: ["High"]
          - Requires-Backup: [true]
          - Reversible: [false]
          
          ## Structure Details:
          - Creates function `public.delete_user_and_profile(uuid)`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [Admin role is checked inside the function]
          
          ## Performance Impact:
          - Indexes: [N/A]
          - Triggers: [N/A]
          - Estimated Impact: [Low]
          */
create or replace function public.delete_user_and_profile(user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select role from public.profiles where id = auth.uid()) != 'admin' then
    raise exception 'Permission denied: You must be an admin to delete users.';
  end if;
  delete from auth.users where id = user_id;
end;
$$;


/*
          # [Function] Secure handle_new_user function
          [This function creates a profile for a new user upon sign-up.]

          ## Query Description: [This operation re-creates the trigger function that automatically creates a user profile. It sets a secure `search_path` to resolve the security advisory warning.]
          
          ## Metadata:
          - Schema-Category: ["Security", "Structural"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Re-creates function `public.handle_new_user()`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [N/A - Trigger]
          
          ## Performance Impact:
          - Indexes: [N/A]
          - Triggers: [Modifies existing trigger's function]
          - Estimated Impact: [Low]
          */
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  return new;
end;
$$;


/*
          # [Function] Secure get_monthly_fee_summary function
          [This function calculates the fee summary for the dashboard.]

          ## Query Description: [This operation re-creates the function for dashboard analytics. It sets a secure `search_path` to resolve the security advisory warning.]
          
          ## Metadata:
          - Schema-Category: ["Security", "Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Re-creates function `public.get_monthly_fee_summary()`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [Authenticated user]
          
          ## Performance Impact:
          - Indexes: [N/A]
          - Triggers: [N/A]
          - Estimated Impact: [Low]
          */
create or replace function public.get_monthly_fee_summary()
returns table(month text, total numeric, collected numeric)
language sql
stable
set search_path = ''
as $$
  select
    to_char(date_series.month, 'Mon') as month,
    coalesce(sum(f.total_amount), 0) as total,
    coalesce(sum(f.paid_amount), 0) as collected
  from (
    select date_trunc('month', generate_series(now() - interval '5 months', now(), '1 month')) as month
  ) as date_series
  left join public.fees f on date_trunc('month', f.created_at) = date_series.month
  group by date_series.month
  order by date_series.month;
$$;


/*
          # [Function] Secure get_block_occupancy function
          [This function calculates room occupancy by block for the dashboard.]

          ## Query Description: [This operation re-creates the function for dashboard analytics. It sets a secure `search_path` to resolve the security advisory warning.]
          
          ## Metadata:
          - Schema-Category: ["Security", "Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Re-creates function `public.get_block_occupancy()`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [Authenticated user]
          
          ## Performance Impact:
          - Indexes: [N/A]
          - Triggers: [N/A]
          - Estimated Impact: [Low]
          */
create or replace function public.get_block_occupancy()
returns table(block text, total bigint, occupied bigint)
language sql
stable
set search_path = ''
as $$
  select
    r.block,
    count(r.id) as total,
    count(case when r.status = 'occupied' then 1 end) as occupied
  from public.rooms r
  group by r.block
  order by r.block;
$$;
