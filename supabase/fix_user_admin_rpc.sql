-- Fix /users admin operations for frontend publishable-key clients.
-- Run this in the Supabase SQL Editor for an existing project.

create extension if not exists pgcrypto with schema extensions;



create or replace function public.rpc_create_user_admin(
  p_email text,
  p_password text,
  p_name text,
  p_phone text,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  new_user_id uuid := extensions.gen_random_uuid();
  v_password_hash text;
  v_actor_role text;
begin
  select u.raw_user_meta_data->>'role'
  into v_actor_role
  from auth.users u
  where u.id = auth.uid();

  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if v_actor_role <> 'MASTER_ADMIN' then
    raise exception 'Only Master Admin can create users.';
  end if;

  if nullif(trim(p_email), '') is null then
    raise exception 'Email is required';
  end if;

  if nullif(p_password, '') is null then
    raise exception 'Password is required';
  end if;

  if p_role not in ('MASTER_ADMIN', 'ADMIN', 'DRIVER', 'CONDUCTOR', 'PASSENGER') then
    raise exception 'Invalid role: %', p_role;
  end if;

  if exists (select 1 from auth.users where email = lower(trim(p_email))) then
    raise exception 'A user with this email already exists.';
  end if;

  v_password_hash := extensions.crypt(p_password, extensions.gen_salt('bf'));

  insert into auth.users (
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
    confirmation_token,
    email_change_token_new,
    recovery_token,
    email_change,
    phone_change,
    reauthentication_token,
    email_change_token_current,
    phone_change_token
  ) values (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    lower(trim(p_email)),
    v_password_hash,
    now(),
    json_build_object('provider', 'email', 'providers', array['email'])::jsonb,
    json_build_object('name', p_name, 'role', p_role, 'phone', p_phone, 'status', 'ACTIVE')::jsonb,
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );



  return jsonb_build_object(
    'success', true,
    'user_id', new_user_id,
    'message', 'User successfully created'
  );
exception
  when others then
    return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

create or replace function public.rpc_update_user(
  p_user_id uuid,
  p_name text,
  p_phone text,
  p_status text,
  p_role text
)
returns json
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_actor_role text;
  v_email text;
begin
  select u.raw_user_meta_data->>'role'
  into v_actor_role
  from auth.users u
  where u.id = auth.uid();

  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if v_actor_role <> 'MASTER_ADMIN' then
    raise exception 'Only Master Admin can update users.';
  end if;

  if p_role not in ('MASTER_ADMIN', 'ADMIN', 'DRIVER', 'CONDUCTOR', 'PASSENGER') then
    raise exception 'Invalid role: %', p_role;
  end if;

  if p_status not in ('ACTIVE', 'INACTIVE') then
    raise exception 'Invalid status: %', p_status;
  end if;

  update auth.users
  set
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) ||
      jsonb_build_object('name', p_name, 'phone', p_phone, 'role', p_role, 'status', p_status),
    updated_at = now()
  where id = p_user_id
  returning email into v_email;

  if v_email is null then
    raise exception 'User not found';
  end if;



  return json_build_object('success', true);
exception
  when others then
    return json_build_object('success', false, 'error', sqlerrm);
end;
$$;

create or replace function public.rpc_delete_user(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_actor_role text;
begin
  select u.raw_user_meta_data->>'role'
  into v_actor_role
  from auth.users u
  where u.id = auth.uid();

  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if v_actor_role <> 'MASTER_ADMIN' then
    raise exception 'Only Master Admin can delete users.';
  end if;

  delete from auth.users where id = p_user_id;
  return json_build_object('success', true);
exception
  when others then
    return json_build_object('success', false, 'error', sqlerrm);
end;
$$;

grant execute on function public.rpc_create_user_admin(text, text, text, text, text) to authenticated;
grant execute on function public.rpc_update_user(uuid, text, text, text, text) to authenticated;
grant execute on function public.rpc_delete_user(uuid) to authenticated;
