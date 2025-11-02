/*
# [Fix Remaining Function Search Paths]
This migration secures the remaining trigger functions by explicitly setting their `search_path`. This resolves the final security warnings from the Supabase advisor and prevents potential schema-hijacking vulnerabilities.

## Query Description: This operation modifies two existing trigger functions (`update_fee_status_on_transaction` and `create_fee_record_for_new_student`) to make them more secure. There is no risk to existing data.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Modifies function: `public.update_fee_status_on_transaction`
- Modifies function: `public.create_fee_record_for_new_student`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None
- Mitigates: Schema-hijacking risks by setting a fixed `search_path`.

## Performance Impact:
- Indexes: None
- Triggers: Unchanged in logic, only security attribute added.
- Estimated Impact: Negligible.
*/

-- Fix search_path for update_fee_status_on_transaction
CREATE OR REPLACE FUNCTION public.update_fee_status_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    fee_rec RECORD;
    new_paid_amount NUMERIC;
    new_balance NUMERIC;
    new_status TEXT;
BEGIN
    -- Determine the fee_record_id from either INSERT or UPDATE on transactions
    IF TG_OP = 'INSERT' THEN
        SELECT * INTO fee_rec FROM fee_records WHERE id = NEW.fee_record_id;
        new_paid_amount := fee_rec.paid_amount + NEW.paid_amount;
    ELSIF TG_OP = 'UPDATE' THEN
        SELECT * INTO fee_rec FROM fee_records WHERE id = NEW.fee_record_id;
        new_paid_amount := fee_rec.paid_amount - OLD.paid_amount + NEW.paid_amount;
    ELSIF TG_OP = 'DELETE' THEN
        SELECT * INTO fee_rec FROM fee_records WHERE id = OLD.fee_record_id;
        new_paid_amount := fee_rec.paid_amount - OLD.paid_amount;
    END IF;

    new_balance := fee_rec.total_amount - new_paid_amount;

    IF new_balance <= 0 THEN
        new_status := 'Paid';
    ELSIF new_paid_amount > 0 THEN
        new_status := 'Partial';
    ELSE
        new_status := 'Unpaid';
    END IF;

    UPDATE fee_records
    SET
        paid_amount = new_paid_amount,
        balance = new_balance,
        status = new_status
    WHERE id = fee_rec.id;

    RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$;


-- Fix search_path for create_fee_record_for_new_student
CREATE OR REPLACE FUNCTION public.create_fee_record_for_new_student()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.fee_records (student_id, total_amount, paid_amount, balance, status)
  VALUES (NEW.id, 50000, 0, 50000, 'Unpaid'); -- Default fee amount
  RETURN NEW;
END;
$$;
