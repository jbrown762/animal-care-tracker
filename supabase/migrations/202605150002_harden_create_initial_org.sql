drop function if exists public.create_initial_org(text, text);

create or replace function public.create_initial_org(org_name text, member_display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if nullif(trim(org_name), '') is null then
    raise exception 'Organization name is required.';
  end if;

  insert into public.users (id, email, display_name)
  select
    auth.uid(),
    coalesce(au.email, ''),
    coalesce(nullif(create_initial_org.member_display_name, ''), au.raw_user_meta_data ->> 'display_name', split_part(coalesce(au.email, 'New user'), '@', 1))
  from auth.users au
  where au.id = auth.uid()
  on conflict (id) do update
  set email = excluded.email,
      display_name = excluded.display_name,
      updated_at = now();

  update public.users
  set display_name = coalesce(nullif(create_initial_org.member_display_name, ''), public.users.display_name)
  where id = auth.uid();

  insert into public.organizations (name, plan_animal_limit, plan_user_limit)
  values (trim(org_name), 5, 3)
  returning id into new_org_id;

  insert into public.org_memberships (org_id, user_id, role, joined_at)
  values (new_org_id, auth.uid(), 'admin', now());

  perform public.seed_org_defaults(new_org_id);

  return new_org_id;
end;
$$;
