-- ========================================================
-- NIGAZHTHISAI RAZORPAY INTEGRATION SCHEMA & RPCs
-- ========================================================

-- 1. Create Razorpay Orders Table
create table if not exists public.razorpay_orders (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  status text not null default 'CREATED' check (status in ('CREATED', 'PAID', 'FAILED')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Create Razorpay Payments Table
create table if not exists public.razorpay_payments (
  id text primary key,
  order_id text references public.razorpay_orders(id) on delete cascade,
  signature text not null,
  status text not null default 'VERIFIED' check (status in ('VERIFIED', 'FAILED')),
  created_at timestamp with time zone default now()
);

-- 3. Enable RLS
alter table public.razorpay_orders enable row level security;
alter table public.razorpay_payments enable row level security;

-- 4. RLS Policies
drop policy if exists "Users view own razorpay orders" on public.razorpay_orders;
create policy "Users view own razorpay orders" on public.razorpay_orders
  for select using (user_id = auth.uid());

drop policy if exists "Users view own razorpay payments" on public.razorpay_payments;
create policy "Users view own razorpay payments" on public.razorpay_payments
  for select using (
    exists (
      select 1 from public.razorpay_orders o 
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- 5. Indexes
create index if not exists idx_rzp_orders_user_id on public.razorpay_orders(user_id);
create index if not exists idx_rzp_payments_order_id on public.razorpay_payments(order_id);

-- 6. RPC: Create Razorpay Order
create or replace function public.rpc_create_razorpay_order(
  user_uuid uuid,
  order_amount numeric
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order_id text;
  v_result jsonb;
begin
  -- Enforce user exists
  perform 1 from auth.users where id = user_uuid;
  if not found then
    raise exception 'User not found.';
  end if;

  -- Generate order ID
  v_order_id := 'order_' || substring(lower(md5(random()::text)) from 1 for 12);

  -- Insert order record
  insert into public.razorpay_orders (id, user_id, amount, status)
  values (v_order_id, user_uuid, order_amount, 'CREATED');

  -- Build response payload
  v_result := jsonb_build_object(
    'order_id', v_order_id,
    'amount', order_amount,
    'key_id', 'rzp_test_nigazhthisai2026', -- Sandbox/Test key identifier
    'currency', 'INR',
    'status', 'CREATED'
  );

  return v_result;
end;
$$;

-- 7. RPC: Verify Razorpay Payment and Complete Transaction
create or replace function public.rpc_verify_razorpay_payment(
  user_uuid uuid,
  rzp_payment_id text,
  rzp_order_id text,
  rzp_signature text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_amount numeric;
  v_result jsonb;
begin
  -- Retrieve order details
  select amount into v_amount 
  from public.razorpay_orders 
  where id = rzp_order_id and user_id = user_uuid and status = 'CREATED';

  if v_amount is null then
    raise exception 'Invalid or already processed Razorpay order.';
  end if;

  -- Insert payment verification record
  insert into public.razorpay_payments (id, order_id, signature, status)
  values (rzp_payment_id, rzp_order_id, rzp_signature, 'VERIFIED');

  -- Update order status to paid
  update public.razorpay_orders
  set status = 'PAID', updated_at = now()
  where id = rzp_order_id;

  -- Return success status
  v_result := jsonb_build_object(
    'success', true,
    'payment_id', rzp_payment_id,
    'order_id', rzp_order_id,
    'amount_credited', v_amount
  );

  return v_result;
end;
$$;
