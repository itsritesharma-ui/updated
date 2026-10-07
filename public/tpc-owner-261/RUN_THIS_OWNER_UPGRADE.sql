-- ThePageCraft Owner Control Center v3 upgrade
-- Run this in Supabase SQL Editor AFTER the earlier CMS setup.
-- Safe to re-run. It does not delete products, posts, users, or purchases.

begin;

-- ---------- Admin roles ----------
alter table if exists public.admin_users
  add column if not exists role text not null default 'admin';
alter table if exists public.admin_users
  add column if not exists display_name text;
alter table if exists public.admin_users
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when lower(coalesce(auth.jwt() ->> 'email','')) = 'meritesharma-admin@thepagecraft.in' then 'owner'
    else coalesce((select role from public.admin_users where user_id = auth.uid()), 'none')
  end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.admin_role() in ('owner','super_admin','admin','editor');
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.admin_role() in ('owner','super_admin');
$$;

revoke all on function public.admin_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_owner() from public;
grant execute on function public.admin_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_owner() to authenticated;

alter table public.admin_users enable row level security;
drop policy if exists "Owners can read all admins" on public.admin_users;
create policy "Owners can read all admins" on public.admin_users
for select to authenticated using (public.is_owner());
drop policy if exists "Owners can add admins" on public.admin_users;
create policy "Owners can add admins" on public.admin_users
for insert to authenticated with check (public.is_owner());
drop policy if exists "Owners can update admins" on public.admin_users;
create policy "Owners can update admins" on public.admin_users
for update to authenticated using (public.is_owner()) with check (public.is_owner());
drop policy if exists "Owners can remove admins" on public.admin_users;
create policy "Owners can remove admins" on public.admin_users
for delete to authenticated using (public.is_owner());

grant select, insert, update, delete on public.admin_users to authenticated;

-- ---------- Purchases / manual book access ----------
create table if not exists public.purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id int not null,
  status text not null default 'paid',
  amount int,
  created_at timestamptz default now()
);

alter table public.purchases add column if not exists source text not null default 'payment';
alter table public.purchases add column if not exists note text;
alter table public.purchases add column if not exists granted_by uuid references auth.users(id) on delete set null;
alter table public.purchases add column if not exists updated_at timestamptz not null default now();

alter table public.purchases enable row level security;

-- Remove the older overly-permissive insert policy if it exists.
drop policy if exists "Service role inserts" on public.purchases;

-- Keep customers limited to their own records; admins can see/manage all.
drop policy if exists "Admins view all purchases" on public.purchases;
create policy "Admins view all purchases" on public.purchases
for select to authenticated using (public.is_admin());

drop policy if exists "Admins insert purchases" on public.purchases;
create policy "Admins insert purchases" on public.purchases
for insert to authenticated with check (public.is_admin());

drop policy if exists "Admins update purchases" on public.purchases;
create policy "Admins update purchases" on public.purchases
for update to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update on public.purchases to authenticated;

-- ---------- User directory (admin-only RPC) ----------
create or replace function public.admin_list_users()
returns table(
  user_id uuid,
  email text,
  display_name text,
  provider text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  return query
  select
    u.id,
    u.email::text,
    coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(coalesce(u.email,''),'@',1))::text,
    coalesce(u.raw_app_meta_data->>'provider','email')::text,
    u.created_at,
    u.last_sign_in_at
  from auth.users u
  order by u.created_at desc;
end;
$$;
revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

-- ---------- Admin team directory ----------
create or replace function public.admin_list_admins()
returns table(user_id uuid, email text, display_name text, role text, created_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_owner() then raise exception 'Owner access required'; end if;
  return query
  select
    u.id,
    u.email::text,
    coalesce(a.display_name, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(coalesce(u.email,''),'@',1))::text,
    case when lower(coalesce(u.email,''))='meritesharma-admin@thepagecraft.in' then 'owner' else coalesce(a.role,'admin') end::text,
    coalesce(a.created_at,u.created_at)
  from auth.users u
  left join public.admin_users a on a.user_id=u.id
  where a.user_id is not null or lower(coalesce(u.email,''))='meritesharma-admin@thepagecraft.in'
  order by 4, 5;
end;
$$;

create or replace function public.admin_set_role(target_user uuid, new_role text, display text default null)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare target_email text;
begin
  if not public.is_owner() then raise exception 'Owner access required'; end if;
  if new_role not in ('super_admin','admin','editor') then raise exception 'Invalid role'; end if;
  select email into target_email from auth.users where id=target_user;
  if target_email is null then raise exception 'User not found'; end if;
  if lower(target_email)='meritesharma-admin@thepagecraft.in' then raise exception 'Primary owner role cannot be changed'; end if;
  insert into public.admin_users(user_id, role, display_name, updated_at)
  values(target_user,new_role,display,now())
  on conflict(user_id) do update set role=excluded.role, display_name=coalesce(excluded.display_name,public.admin_users.display_name), updated_at=now();
  return true;
end;
$$;

create or replace function public.admin_remove_role(target_user uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare target_email text;
begin
  if not public.is_owner() then raise exception 'Owner access required'; end if;
  select email into target_email from auth.users where id=target_user;
  if lower(coalesce(target_email,''))='meritesharma-admin@thepagecraft.in' then raise exception 'Primary owner cannot be removed'; end if;
  delete from public.admin_users where user_id=target_user;
  return true;
end;
$$;

revoke all on function public.admin_list_admins() from public;
revoke all on function public.admin_set_role(uuid,text,text) from public;
revoke all on function public.admin_remove_role(uuid) from public;
grant execute on function public.admin_list_admins() to authenticated;
grant execute on function public.admin_set_role(uuid,text,text) to authenticated;
grant execute on function public.admin_remove_role(uuid) to authenticated;

-- ---------- Secure manual book access ----------
create or replace function public.admin_grant_book_access(target_user uuid, target_product int, access_note text default 'Granted by admin')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare existing_id uuid; new_id uuid;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  select id into existing_id from public.purchases
  where user_id=target_user and product_id=target_product and status='paid'
  order by created_at desc limit 1;
  if existing_id is not null then return existing_id; end if;
  insert into public.purchases(user_id, product_id, status, amount, source, note, granted_by)
  values(target_user,target_product,'paid',0,'admin_grant',access_note,auth.uid())
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.admin_grant_all_books(target_user uuid, access_note text default 'All books granted by owner')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare p record; added integer:=0;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  for p in select id from public.products loop
    if not exists(select 1 from public.purchases where user_id=target_user and product_id=p.id and status='paid') then
      insert into public.purchases(user_id,product_id,status,amount,source,note,granted_by)
      values(target_user,p.id,'paid',0,'admin_grant',access_note,auth.uid());
      added:=added+1;
    end if;
  end loop;
  return added;
end;
$$;

create or replace function public.admin_revoke_manual_book_access(target_user uuid, target_product int)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  delete from public.purchases
  where user_id=target_user and product_id=target_product and source='admin_grant';
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.admin_grant_book_access(uuid,int,text) from public;
revoke all on function public.admin_grant_all_books(uuid,text) from public;
revoke all on function public.admin_revoke_manual_book_access(uuid,int) from public;
grant execute on function public.admin_grant_book_access(uuid,int,text) to authenticated;
grant execute on function public.admin_grant_all_books(uuid,text) to authenticated;
grant execute on function public.admin_revoke_manual_book_access(uuid,int) to authenticated;

-- ---------- Website settings ----------
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  category text not null default 'general',
  description text default '',
  public boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.site_settings enable row level security;
drop policy if exists "Public reads public site settings" on public.site_settings;
create policy "Public reads public site settings" on public.site_settings
for select to anon,authenticated using (public=true or public.is_admin());
drop policy if exists "Admins add site settings" on public.site_settings;
create policy "Admins add site settings" on public.site_settings
for insert to authenticated with check (public.is_admin());
drop policy if exists "Admins update site settings" on public.site_settings;
create policy "Admins update site settings" on public.site_settings
for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Owners delete site settings" on public.site_settings;
create policy "Owners delete site settings" on public.site_settings
for delete to authenticated using (public.is_owner());

grant select on public.site_settings to anon,authenticated;
grant insert,update,delete on public.site_settings to authenticated;

insert into public.site_settings(key,value,category,description,public) values
('announcement_enabled','false','homepage','Show or hide the website announcement/banner when the public site is wired to settings.',true),
('announcement_text','','homepage','Announcement/banner text.',true),
('featured_product_id','1','homepage','Product ID to feature prominently.',true),
('support_email','','contact','Public support/contact email.',true),
('footer_text','ThePageCraft','footer','Footer brand text.',true)
on conflict(key) do nothing;

-- ---------- Audit log ----------
create table if not exists public.admin_audit_log (
  id bigint generated by default as identity primary key,
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_audit_log enable row level security;
drop policy if exists "Admins read audit log" on public.admin_audit_log;
create policy "Admins read audit log" on public.admin_audit_log for select to authenticated using (public.is_admin());
drop policy if exists "Admins write audit log" on public.admin_audit_log;
create policy "Admins write audit log" on public.admin_audit_log for insert to authenticated with check (public.is_admin() and (admin_id=auth.uid() or admin_id is null));
grant select,insert on public.admin_audit_log to authenticated;

-- ---------- Storage: site media + private book files ----------
insert into storage.buckets(id,name,public) values('site-media','site-media',true)
on conflict(id) do update set public=true;
insert into storage.buckets(id,name,public) values('books','books',false)
on conflict(id) do nothing;

drop policy if exists "Admins can list site media" on storage.objects;
create policy "Admins can list site media" on storage.objects for select to authenticated
using (bucket_id='site-media' and public.is_admin());
drop policy if exists "Admins can manage book files" on storage.objects;
create policy "Admins can manage book files" on storage.objects for all to authenticated
using (bucket_id='books' and public.is_admin())
with check (bucket_id='books' and public.is_admin());

-- Existing site-media upload/update/delete policies from v2 remain valid.


-- ============================================================
-- v5: PDF library + full owner revoke controls
-- ============================================================

-- Each product can point to its private PDF in Storage bucket "books".
alter table public.products add column if not exists pdf_path text;
alter table public.products add column if not exists pdf_pages integer;

-- Full revoke: Owner/Admin can revoke access whether it came from a manual grant
-- or a payment record. We preserve the purchase row for audit/accounting and
-- mark access as revoked instead of deleting history.
create or replace function public.admin_revoke_book_access(target_user uuid, target_product int)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  update public.purchases
     set status='revoked', updated_at=now(),
         note=concat(coalesce(note,''), case when coalesce(note,'')='' then '' else ' | ' end, 'Access revoked by admin')
   where user_id=target_user and product_id=target_product and status='paid';
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.admin_revoke_book_access(uuid,int) from public;
grant execute on function public.admin_revoke_book_access(uuid,int) to authenticated;

-- Customers may read only their own purchase/access records. This is needed by
-- the public My Books screen and keeps revoked books out automatically.
drop policy if exists "Customers read own purchases" on public.purchases;
create policy "Customers read own purchases" on public.purchases
for select to authenticated using (user_id=auth.uid() or public.is_admin());
grant select on public.purchases to authenticated;

-- Authenticated owners of a paid book need to read the matching private PDF.
-- Object paths are matched against products.pdf_path.
drop policy if exists "Paid customers can read owned book files" on storage.objects;
create policy "Paid customers can read owned book files" on storage.objects
for select to authenticated
using (
  bucket_id='books' and (
    public.is_admin() or exists (
      select 1
      from public.products p
      join public.purchases pu on pu.product_id=p.id
      where pu.user_id=auth.uid()
        and pu.status='paid'
        and p.pdf_path=storage.objects.name
    )
  )
);

commit;

-- After running this, reopen ThePageCraft Owner Control Center v3.
