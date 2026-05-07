-- DEV-VAULT DATA — Supabase schema (Auth + DB + RLS + realtime)
-- Run in Supabase SQL editor.

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles: store username and role
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (length(username) >= 3 and length(username) <= 18),
  email text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  network text not null check (network in ('MTN','AIRTEL','GLO')),
  selected_plan text not null,
  phone_number text not null,
  price numeric(12,2) not null,
  payment_status text not null check (payment_status in ('Pending','Awaiting Payment','Paid')) default 'Pending',
  order_status text not null check (order_status in ('Pending','Awaiting Payment','Paid','Processing','Completed','Cancelled')) default 'Pending',
  transaction_id text,
  whatsapp_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders(user_id, created_at desc);
create index if not exists orders_status_idx on public.orders(order_status);
create index if not exists orders_network_idx on public.orders(network);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'info',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id, created_at desc);

-- Transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  amount numeric(12,2) not null,
  bank text not null default 'Moniepoint',
  transaction_id text not null,
  whatsapp_number text,
  created_at timestamptz not null default now()
);

create unique index if not exists transactions_txid_uq on public.transactions(transaction_id);
create index if not exists transactions_user_id_idx on public.transactions(user_id, created_at desc);

-- Data plans (admin can manage pricing)
create table if not exists public.data_plans (
  id uuid primary key default gen_random_uuid(),
  network text not null check (network in ('MTN','AIRTEL','GLO')),
  size_gb int not null check (size_gb in (1,2,3,5,10,15,20)),
  duration_days int not null check (duration_days in (7,14,30,60)),
  price numeric(12,2) not null,
  popular boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(network, size_gb, duration_days)
);

create index if not exists data_plans_network_idx on public.data_plans(network);

-- Admin logs
create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  entity text,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_logs_admin_idx on public.admin_logs(admin_user_id, created_at desc);

-- Realtime enablement (Supabase uses publication)
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.admin_logs;

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.transactions enable row level security;
alter table public.data_plans enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_logs enable row level security;

-- Helper: check admin role
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  );
$$;

-- Profiles policy: user can read/update own profile; admins can read
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (user_id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
on public.profiles
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Orders: user can CRUD own; admins can manage all
create policy "orders_select_own_or_admin"
on public.orders
for select
using (user_id = auth.uid() or public.is_admin());

create policy "orders_insert_own"
on public.orders
for insert
with check (user_id = auth.uid());

create policy "orders_update_own"
on public.orders
for update
using (user_id = auth.uid());

create policy "orders_admin_all"
on public.orders
for all
using (public.is_admin())
with check (public.is_admin());

-- Transactions
create policy "transactions_select_own_or_admin"
on public.transactions
for select
using (user_id = auth.uid() or public.is_admin());

create policy "transactions_insert_own"
on public.transactions
for insert
with check (user_id = auth.uid());

create policy "transactions_admin_all"
on public.transactions
for all
using (public.is_admin())
with check (public.is_admin());

-- Notifications: user own
create policy "notifications_select_own"
on public.notifications
for select
using (user_id = auth.uid());

create policy "notifications_insert_own_admin"
on public.notifications
for insert
with check (
  user_id = auth.uid() or public.is_admin()
);

-- Data plans: allow select to all authenticated, admin can modify
create policy "data_plans_select_auth"
on public.data_plans
for select
using (true);

create policy "data_plans_admin_modify"
on public.data_plans
for all
using (public.is_admin())
with check (public.is_admin());

-- Admin logs: admin only
create policy "admin_logs_admin_only"
on public.admin_logs
for select
using (public.is_admin());

create policy "admin_logs_insert_admin"
on public.admin_logs
for insert
with check (public.is_admin());

-- ============ Trigger: updated_at ==========
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists set_plans_updated_at on public.data_plans;
create trigger set_plans_updated_at
before update on public.data_plans
for each row execute function public.set_updated_at();

-- ============ Seed minimal admin + plans (optional) ============
-- After creating the admin user in Supabase Auth, insert into profiles:
-- insert into public.profiles(user_id, username, email, role) values (..., 'admin', 'admin@example.com', 'admin');


