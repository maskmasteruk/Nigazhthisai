-- ========================================================
-- NIGAZHTHISAI — MASTER ADMIN CREATION SCRIPT
-- ========================================================

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  admin_email text := 'masteradmin@nigazhthisai.tn.gov.in';
  -- Generates a secure bcrypt hash for the password: 'adminpassword123'
  admin_password_hash text := crypt('adminpassword123', gen_salt('bf'));
BEGIN
  -- 1. Create authentication entry in Supabase's auth.users table if it does not already exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
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
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      admin_email,
      admin_password_hash,
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"name": "Nigazhthisai Master Admin", "role": "MASTER_ADMIN", "phone": "+91 99999 99999"}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated',
      ''
    );

    RAISE NOTICE 'Master Admin successfully created with ID % and password "adminpassword123"', new_user_id;
  ELSE
    -- If the user account already exists, ensure the role in auth.users is upgraded
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || '{"role": "MASTER_ADMIN"}'::jsonb
    WHERE email = admin_email;
    
    RAISE NOTICE 'User account % already exists. Role updated/verified to MASTER_ADMIN in user metadata.', admin_email;
  END IF;
END $$;
