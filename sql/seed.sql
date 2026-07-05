-- ========================================================
-- NIGAZHTHISAI SEED DATA
-- ========================================================

-- Seed Dummy Test User for Integration Tests
DO $$
DECLARE
  v_dummy_id uuid := '00000000-0000-0000-0000-000000000000';
  v_email text := 'testuser@nigazhthisai.tn.gov.in';
  v_password_hash text := crypt('testpassword123', gen_salt('bf'));
BEGIN
  -- Insert into auth.users if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_dummy_id) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token
    ) VALUES (
      v_dummy_id,
      '00000000-0000-0000-0000-000000000000',
      v_email,
      v_password_hash,
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"name": "Nigazhthisai Test User", "role": "PASSENGER"}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated',
      ''
    );
  END IF;

END;
$$;
