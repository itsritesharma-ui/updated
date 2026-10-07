-- ThePageCraft v8: coupons, customer profiles and targeted campaigns
-- Run once in Supabase SQL Editor AFTER RUN_THIS_OWNER_UPGRADE.sql.
-- Safe to re-run. No existing account, order, book or post is deleted.

begin;

-- ---------- Customer profiles ----------
create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  city text,
  state text,
  country text not null default 'India',
  language text not null default 'English',
  customer_tier text not null default 'Reader' check (customer_tier in ('Reader','Premium','VIP')),
  tags text[] not null default '{}',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.customer_profiles(user_id,display_name,created_at)
select u.id,
       coalesce(u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name',split_part(coalesce(u.email,''),'@',1)),
       u.created_at
from auth.users u
on conflict(user_id) do nothing;

create or replace function public.create_customer_profile()
returns trigger
language plpgsql
security definer
set search_path=public,auth
as $$
begin
  insert into public.customer_profiles(user_id,display_name,created_at)
  values(new.id,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',split_part(coalesce(new.email,''),'@',1)),new.created_at)
  on conflict(user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_customer_profile_after_signup on auth.users;
create trigger create_customer_profile_after_signup
after insert on auth.users for each row execute function public.create_customer_profile();

alter table public.customer_profiles enable row level security;
drop policy if exists "Customers read own profile" on public.customer_profiles;
create policy "Customers read own profile" on public.customer_profiles
for select to authenticated using(user_id=auth.uid() or public.is_admin());
drop policy if exists "Customers update own profile" on public.customer_profiles;
drop policy if exists "Admins create profiles" on public.customer_profiles;
grant select on public.customer_profiles to authenticated;
revoke insert,update,delete on public.customer_profiles from authenticated;

create or replace function public.admin_list_customer_profiles()
returns table(
  user_id uuid,email text,display_name text,provider text,phone text,city text,state text,country text,
  language text,customer_tier text,tags text[],admin_notes text,created_at timestamptz,
  last_sign_in_at timestamptz,email_confirmed_at timestamptz,updated_at timestamptz
)
language plpgsql
security definer
set search_path=public,auth
as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  return query
  select u.id,u.email::text,
    coalesce(p.display_name,u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name',split_part(coalesce(u.email,''),'@',1))::text,
    coalesce(u.raw_app_meta_data->>'provider','email')::text,p.phone,p.city,p.state,
    coalesce(p.country,'India')::text,coalesce(p.language,'English')::text,
    coalesce(p.customer_tier,'Reader')::text,coalesce(p.tags,'{}'::text[]),p.admin_notes,
    u.created_at,u.last_sign_in_at,u.email_confirmed_at,p.updated_at
  from auth.users u left join public.customer_profiles p on p.user_id=u.id
  order by u.created_at desc;
end;
$$;
revoke all on function public.admin_list_customer_profiles() from public;
grant execute on function public.admin_list_customer_profiles() to authenticated;

create or replace function public.admin_update_customer_profile(
  target_user uuid,new_display_name text,new_phone text,new_city text,new_state text,new_country text,
  new_language text,new_customer_tier text,new_tags text[],new_admin_notes text
)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if new_customer_tier not in ('Reader','Premium','VIP') then raise exception 'Invalid customer tier'; end if;
  insert into public.customer_profiles(user_id,display_name,phone,city,state,country,language,customer_tier,tags,admin_notes,updated_at,updated_by)
  values(target_user,nullif(trim(new_display_name),''),nullif(trim(new_phone),''),nullif(trim(new_city),''),nullif(trim(new_state),''),
    coalesce(nullif(trim(new_country),''),'India'),coalesce(nullif(trim(new_language),''),'English'),new_customer_tier,
    coalesce(new_tags,'{}'::text[]),nullif(trim(new_admin_notes),''),now(),auth.uid())
  on conflict(user_id) do update set display_name=excluded.display_name,phone=excluded.phone,city=excluded.city,
    state=excluded.state,country=excluded.country,language=excluded.language,customer_tier=excluded.customer_tier,
    tags=excluded.tags,admin_notes=excluded.admin_notes,updated_at=now(),updated_by=auth.uid();
  return true;
end;
$$;
revoke all on function public.admin_update_customer_profile(uuid,text,text,text,text,text,text,text,text[],text) from public;
grant execute on function public.admin_update_customer_profile(uuid,text,text,text,text,text,text,text,text[],text) to authenticated;

-- ---------- Coupons ----------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check(code=upper(code)),
  title text not null,
  description text,
  discount_type text not null check(discount_type in ('percent','fixed')),
  discount_value numeric(10,2) not null check(discount_value>0),
  min_order numeric(10,2) not null default 0 check(min_order>=0),
  max_discount numeric(10,2),
  usage_limit integer check(usage_limit is null or usage_limit>0),
  per_user_limit integer not null default 1 check(per_user_limit>0),
  target_product_id integer references public.products(id) on delete set null,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_ref text not null unique,
  subtotal numeric(10,2) not null,
  discount_amount numeric(10,2) not null,
  final_amount numeric(10,2) not null,
  redeemed_at timestamptz not null default now()
);

alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
drop policy if exists "Admins manage coupons" on public.coupons;
create policy "Admins manage coupons" on public.coupons for all to authenticated
using(public.is_admin()) with check(public.is_admin());
drop policy if exists "Admins read redemptions" on public.coupon_redemptions;
create policy "Admins read redemptions" on public.coupon_redemptions for select to authenticated using(public.is_admin());
grant select,insert,update,delete on public.coupons to authenticated;
grant select on public.coupon_redemptions to authenticated;

alter table public.purchases alter column amount type numeric(10,2) using amount::numeric;
alter table public.purchases add column if not exists coupon_code text;
alter table public.purchases add column if not exists discount_amount numeric(10,2) not null default 0;
alter table public.purchases add column if not exists payment_txnid text;
create index if not exists purchases_payment_txnid_idx on public.purchases(payment_txnid);

create or replace function public.calculate_order_quote(item_ids integer[],coupon_code text,customer_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  c public.coupons%rowtype;
  subtotal numeric(10,2):=0;
  applicable numeric(10,2):=0;
  discount numeric(10,2):=0;
  total_uses integer:=0;
  user_uses integer:=0;
  item_count integer:=0;
begin
  if item_ids is null or cardinality(item_ids)=0 then
    return jsonb_build_object('valid',false,'error','Your cart is empty');
  end if;
  select coalesce(sum(price),0),count(*) into subtotal,item_count
  from public.products where active=true and id=any(item_ids);
  if item_count<>cardinality(item_ids) then
    return jsonb_build_object('valid',false,'error','One or more books are unavailable');
  end if;
  if nullif(trim(coupon_code),'') is null then
    return jsonb_build_object('valid',true,'subtotal',subtotal,'discount',0,'total',subtotal,'coupon_code',null);
  end if;
  select * into c from public.coupons where code=upper(trim(coupon_code));
  if c.id is null or not c.active then return jsonb_build_object('valid',false,'error','Coupon code is invalid or inactive','subtotal',subtotal); end if;
  if c.starts_at>now() then return jsonb_build_object('valid',false,'error','This coupon has not started yet','subtotal',subtotal); end if;
  if c.expires_at is not null and c.expires_at<now() then return jsonb_build_object('valid',false,'error','This coupon has expired','subtotal',subtotal); end if;
  if subtotal<c.min_order then return jsonb_build_object('valid',false,'error',format('Minimum order is ₹%s',c.min_order),'subtotal',subtotal); end if;
  select count(*) into total_uses from public.coupon_redemptions where coupon_id=c.id;
  if c.usage_limit is not null and total_uses>=c.usage_limit then return jsonb_build_object('valid',false,'error','Coupon usage limit has been reached','subtotal',subtotal); end if;
  if customer_user is not null then
    select count(*) into user_uses from public.coupon_redemptions where coupon_id=c.id and user_id=customer_user;
    if user_uses>=c.per_user_limit then return jsonb_build_object('valid',false,'error','You have already used this coupon','subtotal',subtotal); end if;
  end if;
  if c.target_product_id is null then applicable:=subtotal;
  else
    select coalesce(max(price),0) into applicable from public.products where id=c.target_product_id and c.target_product_id=any(item_ids);
    if applicable=0 then return jsonb_build_object('valid',false,'error','This coupon is not valid for the books in your cart','subtotal',subtotal); end if;
  end if;
  if c.discount_type='percent' then discount:=round(applicable*c.discount_value/100,2);
  else discount:=least(c.discount_value,applicable); end if;
  if c.max_discount is not null then discount:=least(discount,c.max_discount); end if;
  discount:=least(discount,subtotal);
  return jsonb_build_object('valid',true,'coupon_id',c.id,'coupon_code',c.code,'title',c.title,
    'subtotal',subtotal,'discount',discount,'total',greatest(0,subtotal-discount));
end;
$$;
revoke all on function public.calculate_order_quote(integer[],text,uuid) from public;

create or replace function public.quote_order(item_ids integer[],coupon_code text default null)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  return public.calculate_order_quote(item_ids,coupon_code,auth.uid());
end;
$$;
revoke all on function public.quote_order(integer[],text) from public;
grant execute on function public.quote_order(integer[],text) to authenticated;

create or replace function public.complete_paid_order(
  payment_transaction_id text,target_user uuid,item_ids integer[],coupon_code text,paid_amount numeric
)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare q jsonb; p record; share numeric(10,2); coupon_uuid uuid;
begin
  if auth.role()<>'service_role' then raise exception 'Service role required'; end if;
  if exists(select 1 from public.purchases where payment_txnid=payment_transaction_id) then return true; end if;
  q:=public.calculate_order_quote(item_ids,coupon_code,target_user);
  if not coalesce((q->>'valid')::boolean,false) then raise exception '%',coalesce(q->>'error','Invalid order'); end if;
  if abs((q->>'total')::numeric-paid_amount)>0.01 then raise exception 'Paid amount does not match order quote'; end if;
  for p in select id,price from public.products where id=any(item_ids) loop
    share:=case when (q->>'subtotal')::numeric=0 then 0 else round(paid_amount*p.price/(q->>'subtotal')::numeric,2) end;
    insert into public.purchases(user_id,product_id,status,amount,source,note,updated_at,coupon_code,discount_amount,payment_txnid)
    values(target_user,p.id,'paid',share,'payment','Verified PayU payment',now(),nullif(upper(trim(coupon_code)),''),
      round((q->>'discount')::numeric*p.price/(q->>'subtotal')::numeric,2),payment_transaction_id);
  end loop;
  if q->>'coupon_id' is not null then
    coupon_uuid:=(q->>'coupon_id')::uuid;
    insert into public.coupon_redemptions(coupon_id,user_id,order_ref,subtotal,discount_amount,final_amount)
    values(coupon_uuid,target_user,payment_transaction_id,(q->>'subtotal')::numeric,(q->>'discount')::numeric,(q->>'total')::numeric)
    on conflict(order_ref) do nothing;
  end if;
  return true;
end;
$$;
revoke all on function public.complete_paid_order(text,uuid,integer[],text,numeric) from public,anon,authenticated;
grant execute on function public.complete_paid_order(text,uuid,integer[],text,numeric) to service_role;

-- ---------- Targeted notifications, posters and coupon campaigns ----------
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_type text not null check(campaign_type in ('notification','poster','coupon')),
  title text not null,
  message text not null,
  poster_url text,
  button_text text,
  button_url text,
  coupon_id uuid references public.coupons(id) on delete set null,
  audience_type text not null default 'all' check(audience_type in ('all','selected')),
  priority integer not null default 0,
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_recipients (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(campaign_id,user_id)
);

create table if not exists public.campaign_views (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  dismissed_at timestamptz,
  clicked_at timestamptz,
  primary key(campaign_id,user_id)
);

alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;
alter table public.campaign_views enable row level security;
drop policy if exists "Admins manage campaigns" on public.campaigns;
create policy "Admins manage campaigns" on public.campaigns for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "Admins manage campaign recipients" on public.campaign_recipients;
create policy "Admins manage campaign recipients" on public.campaign_recipients for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "Admins read campaign views" on public.campaign_views;
create policy "Admins read campaign views" on public.campaign_views for select to authenticated using(public.is_admin());
grant select,insert,update,delete on public.campaigns,public.campaign_recipients to authenticated;
grant select on public.campaign_views to authenticated;

create or replace function public.get_my_campaigns()
returns table(
  id uuid,campaign_type text,title text,message text,poster_url text,button_text text,button_url text,
  coupon_code text,coupon_title text,starts_at timestamptz,ends_at timestamptz,priority integer
)
language plpgsql
security definer
set search_path=public
as $$
begin
  if auth.uid() is null then return; end if;
  return query
  select c.id,c.campaign_type,c.title,c.message,c.poster_url,c.button_text,c.button_url,
    cp.code,cp.title,c.starts_at,c.ends_at,c.priority
  from public.campaigns c
  left join public.coupons cp on cp.id=c.coupon_id
  where c.active=true and c.starts_at<=now() and (c.ends_at is null or c.ends_at>=now())
    and (c.audience_type='all' or exists(select 1 from public.campaign_recipients r where r.campaign_id=c.id and r.user_id=auth.uid()))
    and not exists(select 1 from public.campaign_views v where v.campaign_id=c.id and v.user_id=auth.uid() and v.dismissed_at is not null)
  order by c.priority desc,c.created_at desc;
end;
$$;
revoke all on function public.get_my_campaigns() from public;
grant execute on function public.get_my_campaigns() to authenticated;

create or replace function public.mark_campaign_event(target_campaign uuid,event_name text)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  if event_name not in ('seen','dismissed','clicked') then raise exception 'Invalid event'; end if;
  insert into public.campaign_views(campaign_id,user_id,first_seen_at,dismissed_at,clicked_at)
  values(target_campaign,auth.uid(),now(),case when event_name='dismissed' then now() end,case when event_name='clicked' then now() end)
  on conflict(campaign_id,user_id) do update set
    dismissed_at=case when event_name='dismissed' then now() else public.campaign_views.dismissed_at end,
    clicked_at=case when event_name='clicked' then now() else public.campaign_views.clicked_at end;
  return true;
end;
$$;
revoke all on function public.mark_campaign_event(uuid,text) from public;
grant execute on function public.mark_campaign_event(uuid,text) to authenticated;

commit;

-- Required server-only Vercel variable for automatic order recording:
-- SUPABASE_SERVICE_ROLE_KEY = copy from Supabase Project Settings > API Keys.
-- Never put that key in VITE_ variables or frontend files.
