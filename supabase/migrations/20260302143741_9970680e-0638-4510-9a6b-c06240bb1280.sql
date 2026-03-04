
-- Core settings
create table public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Transactions (main expense log)
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  category text not null,
  subcategory text,
  description text,
  amount_thb numeric(12,2) not null,
  payment_method text,
  country text default 'Thailand',
  is_reimbursable boolean default false,
  has_receipt boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- Daily log (quick daily food/transport entry)
create table public.daily_log (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  country text not null,
  lunch_thb numeric(10,2) default 0,
  dinner_thb numeric(10,2) default 0,
  other_food_thb numeric(10,2) default 0,
  transport_thb numeric(10,2) default 0,
  misc_thb numeric(10,2) default 0,
  notes text,
  updated_at timestamptz default now()
);

-- Funding received
create table public.funding (
  id uuid primary key default gen_random_uuid(),
  date date,
  source text not null,
  description text,
  amount_thb numeric(12,2) not null,
  is_expected boolean default true,
  is_received boolean default false,
  notes text
);

-- Rent payments
create table public.rent_payments (
  id uuid primary key default gen_random_uuid(),
  month text not null,
  due_date date,
  amount_thb numeric(10,2) default 15500,
  paid_date date,
  is_paid boolean default false,
  payment_method text,
  notes text
);

-- Disable RLS on all tables (single user, no auth)
alter table public.settings enable row level security;
create policy "Allow all on settings" on public.settings for all using (true) with check (true);

alter table public.transactions enable row level security;
create policy "Allow all on transactions" on public.transactions for all using (true) with check (true);

alter table public.daily_log enable row level security;
create policy "Allow all on daily_log" on public.daily_log for all using (true) with check (true);

alter table public.funding enable row level security;
create policy "Allow all on funding" on public.funding for all using (true) with check (true);

alter table public.rent_payments enable row level security;
create policy "Allow all on rent_payments" on public.rent_payments for all using (true) with check (true);
