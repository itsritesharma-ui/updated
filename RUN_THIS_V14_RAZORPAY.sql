-- V14: Razorpay. Run ONCE in Supabase > SQL Editor.
-- Same as complete_paid_order from V8, only the note label says Razorpay.
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
    values(target_user,p.id,'paid',share,'payment','Verified Razorpay payment',now(),nullif(upper(trim(coupon_code)),''),
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
