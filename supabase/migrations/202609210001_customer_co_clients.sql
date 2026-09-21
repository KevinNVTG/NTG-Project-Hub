alter table public.customers
  add column if not exists co_client_first_name text,
  add column if not exists co_client_last_name text,
  add column if not exists co_client_email text,
  add column if not exists co_client_phone text;

comment on column public.customers.co_client_first_name is 'Optional second individual on the same customer record, such as a spouse or co-owner.';
comment on column public.customers.co_client_last_name is 'Optional second individual on the same customer record, such as a spouse or co-owner.';
comment on column public.customers.co_client_email is 'Optional email for the second individual on the customer record.';
comment on column public.customers.co_client_phone is 'Optional phone for the second individual on the customer record.';
