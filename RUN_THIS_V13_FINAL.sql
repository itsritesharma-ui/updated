-- ThePageCraft V13 FINAL - run ONCE in Supabase > SQL Editor > New query > Run
-- Safe to run again: it never deletes your data.

-- 1) Gmail profile pictures in admin Customers
drop function if exists public.admin_list_customer_profiles();
create or replace function public.admin_list_customer_profiles()
returns table(
  user_id uuid,email text,display_name text,provider text,phone text,city text,state text,country text,
  language text,customer_tier text,tags text[],admin_notes text,created_at timestamptz,
  last_sign_in_at timestamptz,email_confirmed_at timestamptz,updated_at timestamptz,avatar_url text
)
language plpgsql security definer set search_path=public,auth as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  return query
  select u.id,u.email::text,
    coalesce(p.display_name,u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name',split_part(coalesce(u.email,''),'@',1))::text,
    coalesce(u.raw_app_meta_data->>'provider','email')::text,p.phone,p.city,p.state,
    coalesce(p.country,'India')::text,coalesce(p.language,'English')::text,
    coalesce(p.customer_tier,'Reader')::text,coalesce(p.tags,'{}'::text[]),p.admin_notes,
    u.created_at,u.last_sign_in_at,u.email_confirmed_at,p.updated_at,
    coalesce(u.raw_user_meta_data->>'avatar_url',u.raw_user_meta_data->>'picture')::text
  from auth.users u left join public.customer_profiles p on p.user_id=u.id
  order by u.created_at desc;
end;
$$;
revoke all on function public.admin_list_customer_profiles() from public;
grant execute on function public.admin_list_customer_profiles() to authenticated;

-- 2) "Notify Me on Launch" subscribers
create table if not exists public.book_launch_subscribers(
  id bigint generated always as identity primary key,
  product_id bigint,
  product_title text,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email)<=200),
  user_id uuid,
  created_at timestamptz not null default now()
);
create unique index if not exists book_launch_subscribers_uniq on public.book_launch_subscribers(coalesce(product_id,0),lower(email));
alter table public.book_launch_subscribers enable row level security;
drop policy if exists "Anyone can subscribe" on public.book_launch_subscribers;
create policy "Anyone can subscribe" on public.book_launch_subscribers for insert to anon,authenticated
  with check (user_id is null or user_id=auth.uid());
drop policy if exists "Admins read subscribers" on public.book_launch_subscribers;
create policy "Admins read subscribers" on public.book_launch_subscribers for select to authenticated using (public.is_admin());
drop policy if exists "Admins delete subscribers" on public.book_launch_subscribers;
create policy "Admins delete subscribers" on public.book_launch_subscribers for delete to authenticated using (public.is_admin());
grant insert on public.book_launch_subscribers to anon,authenticated;
grant select,delete on public.book_launch_subscribers to authenticated;

-- 3) Per-book payment links: stored in site_settings (public, so the website can read it)
insert into public.site_settings(key,value,category,description,public)
values('book_payment_links','{}','store','Per-book payment links (book id to URL).',true)
on conflict (key) do nothing;
alter table public.products add column if not exists payment_link text;  -- optional backup column

-- 4) Check: should return 3 rows
select 'avatar fn' as item, count(*) from pg_proc where proname='admin_list_customer_profiles'
union all select 'subscribers table', count(*) from information_schema.tables where table_name='book_launch_subscribers'
union all select 'payment links row', count(*) from public.site_settings where key='book_payment_links';
