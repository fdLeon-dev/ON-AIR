-- Fix duplicate cart items and ensure constraints are correct
-- Run this in Supabase SQL Editor after running supabase-schema.sql

-- 1. First, identify and log duplicates
select 
  user_id, product_id, size, color, count(*) as count,
  array_agg(id) as ids,
  array_agg(quantity) as quantities
from public.cart_items
group by user_id, product_id, size, color
having count(*) > 1
order by count desc;

-- 2. Delete duplicate rows, keeping only the one with highest quantity
delete from public.cart_items a
where exists (
  select 1 from public.cart_items b
  where a.user_id = b.user_id
    and a.product_id = b.product_id
    and a.size = b.size
    and a.color = b.color
    and (a.quantity < b.quantity or (a.quantity = b.quantity and a.id > b.id))
);

-- 3. Verify no more duplicates
select 
  user_id, product_id, size, color, count(*) as count
from public.cart_items
group by user_id, product_id, size, color
having count(*) > 1;

-- 4. Ensure the unique constraint/index is in place
drop index if exists public.cart_items_user_id_product_id_size_color_idx;
drop index if exists public.cart_items_unique_variant;
alter table public.cart_items drop constraint if exists cart_items_user_id_product_id_size_color_key;
alter table public.cart_items drop constraint if exists cart_items_user_id_product_id_key;

create unique index cart_items_unique_variant 
on public.cart_items(user_id, product_id, size, color);

-- 5. Verify cart structure (should show 0 or 1 row per user+product+size+color combo)
select 
  user_id, product_id, size, color, count(*) as count
from public.cart_items
group by user_id, product_id, size, color
order by user_id, product_id, count desc;

-- ✅ Done! Cart items are now deduplicated
