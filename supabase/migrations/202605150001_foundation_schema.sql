create extension if not exists pgcrypto;

create type public.org_role as enum ('admin', 'caretaker');
create type public.value_type as enum ('completion', 'numeric', 'text', 'food');
create type public.animal_status as enum ('active', 'inactive', 'deceased', 'transferred');
create type public.sex_value as enum ('male', 'female', 'unknown');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_due_soon_days numeric not null default 2 check (default_due_soon_days >= 0),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  plan_animal_limit integer,
  plan_user_limit integer,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.org_memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.org_role not null,
  invited_by uuid references public.users(id),
  joined_at timestamptz,
  display_name_override text,
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table public.org_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.org_role not null,
  invited_by uuid not null references public.users(id),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.animal_classes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create table public.task_category_templates (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.animal_classes(id) on delete cascade,
  species text,
  name text not null,
  value_type public.value_type not null,
  value_unit text,
  interval_days numeric not null check (interval_days >= 0),
  due_soon_days numeric not null check (due_soon_days >= 0),
  instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, name)
);

create table public.task_template_tags (
  task_template_id uuid not null references public.task_category_templates(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (task_template_id, tag_id)
);

create table public.animals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid not null references public.animal_classes(id),
  name text not null,
  species text,
  sex public.sex_value,
  birth_date date,
  source text,
  acquisition_date date,
  photo_url text,
  status public.animal_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

create table public.animal_tasks (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals(id) on delete cascade,
  template_id uuid references public.task_category_templates(id),
  name text not null,
  value_type public.value_type not null,
  value_unit text,
  interval_days numeric not null check (interval_days >= 0),
  due_soon_days numeric not null check (due_soon_days >= 0),
  instructions text,
  is_hidden boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.animal_task_tags (
  animal_task_id uuid not null references public.animal_tasks(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (animal_task_id, tag_id)
);

create table public.food_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create table public.task_log_entries (
  id uuid primary key default gen_random_uuid(),
  animal_task_id uuid not null references public.animal_tasks(id),
  animal_id uuid not null references public.animals(id),
  logged_at timestamptz not null,
  value_numeric numeric,
  value_text text,
  notes text,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_by uuid references public.users(id),
  updated_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references public.users(id)
);

create table public.food_log_items (
  id uuid primary key default gen_random_uuid(),
  log_entry_id uuid not null references public.task_log_entries(id) on delete cascade,
  food_item_id uuid not null references public.food_items(id),
  quantity numeric not null check (quantity > 0),
  quantity_unit text
);

create index org_memberships_user_id_idx on public.org_memberships(user_id);
create index org_memberships_org_id_idx on public.org_memberships(org_id);
create index org_invitations_org_id_idx on public.org_invitations(org_id);
create index animal_classes_org_id_idx on public.animal_classes(org_id);
create index animals_org_id_idx on public.animals(org_id);
create index animal_tasks_animal_id_idx on public.animal_tasks(animal_id);
create index task_log_entries_animal_id_idx on public.task_log_entries(animal_id);
create index task_log_entries_task_day_idx
  on public.task_log_entries(animal_task_id, animal_id, ((logged_at at time zone 'UTC')::date))
  where deleted_at is null;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_users_updated_at before update on public.users for each row execute function public.touch_updated_at();
create trigger touch_organizations_updated_at before update on public.organizations for each row execute function public.touch_updated_at();
create trigger touch_animal_classes_updated_at before update on public.animal_classes for each row execute function public.touch_updated_at();
create trigger touch_task_category_templates_updated_at before update on public.task_category_templates for each row execute function public.touch_updated_at();
create trigger touch_animals_updated_at before update on public.animals for each row execute function public.touch_updated_at();
create trigger touch_animal_tasks_updated_at before update on public.animal_tasks for each row execute function public.touch_updated_at();

create or replace function public.guard_task_log_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org_id uuid;
begin
  if new.created_by <> old.created_by or new.created_at <> old.created_at then
    raise exception 'Log creation attribution cannot be changed.';
  end if;

  select org_id into target_org_id from public.animals where id = old.animal_id;

  if (new.deleted_at is distinct from old.deleted_at or new.deleted_by is distinct from old.deleted_by)
    and not public.is_org_admin(target_org_id) then
    raise exception 'Admin access required to delete log entries.';
  end if;

  if new.deleted_at is not null and new.deleted_by is null then
    new.deleted_by = auth.uid();
  end if;

  if new.deleted_at is null then
    new.updated_by = auth.uid();
    new.updated_at = now();
  end if;

  return new;
end;
$$;

create trigger guard_task_log_update before update on public.task_log_entries for each row execute function public.guard_task_log_update();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'New user'), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set email = excluded.email,
      display_name = excluded.display_name,
      avatar_url = excluded.avatar_url,
      updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
after insert or update on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.org_memberships
    where org_id = target_org_id
      and user_id = auth.uid()
      and joined_at is not null
  );
$$;

create or replace function public.is_org_admin(target_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.org_memberships
    where org_id = target_org_id
      and user_id = auth.uid()
      and role = 'admin'
      and joined_at is not null
  );
$$;

create or replace function public.assert_last_admin_safe(target_org_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count integer;
  target_is_admin boolean;
begin
  select count(*) into admin_count
  from public.org_memberships
  where org_id = target_org_id and role = 'admin' and joined_at is not null;

  select exists (
    select 1 from public.org_memberships
    where org_id = target_org_id and user_id = target_user_id and role = 'admin' and joined_at is not null
  ) into target_is_admin;

  if target_is_admin and admin_count <= 1 then
    raise exception 'At least one Admin must remain in the organization.';
  end if;
end;
$$;

create or replace function public.seed_org_defaults(target_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.animal_classes (org_id, name)
  values
    (target_org_id, 'Reptile'),
    (target_org_id, 'Bird'),
    (target_org_id, 'Mammal'),
    (target_org_id, 'Amphibian'),
    (target_org_id, 'Fish'),
    (target_org_id, 'Invertebrate')
  on conflict (org_id, name) do nothing;

  insert into public.tags (org_id, name, color)
  values
    (target_org_id, 'Diet', '#2f6f4e'),
    (target_org_id, 'Enclosure', '#3f7cac'),
    (target_org_id, 'Stats', '#7b8f3b'),
    (target_org_id, 'Health', '#d7664f'),
    (target_org_id, 'Hygiene', '#c9861a')
  on conflict (org_id, name) do nothing;

  insert into public.food_items (org_id, name)
  values
    (target_org_id, 'Mice'),
    (target_org_id, 'Rats'),
    (target_org_id, 'Crickets'),
    (target_org_id, 'Kale')
  on conflict (org_id, name) do nothing;
end;
$$;

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
  values (nullif(trim(org_name), ''), 5, 3)
  returning id into new_org_id;

  insert into public.org_memberships (org_id, user_id, role, joined_at)
  values (new_org_id, auth.uid(), 'admin', now());

  perform public.seed_org_defaults(new_org_id);

  return new_org_id;
end;
$$;

create or replace function public.invite_org_member(target_org_id uuid, target_email text, target_role public.org_role)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_token text;
begin
  if not public.is_org_admin(target_org_id) then
    raise exception 'Admin access required.';
  end if;

  insert into public.org_invitations (org_id, email, role, invited_by)
  values (target_org_id, lower(trim(target_email)), target_role, auth.uid())
  returning token into invite_token;

  return invite_token;
end;
$$;

create or replace function public.accept_org_invitation(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.org_invitations%rowtype;
  current_email text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select lower(email) into current_email from public.users where id = auth.uid();

  select * into invite
  from public.org_invitations
  where token = invite_token
    and accepted_at is null
    and revoked_at is null
    and expires_at > now();

  if invite.id is null then
    raise exception 'Invitation is invalid or expired.';
  end if;

  if lower(invite.email) <> current_email then
    raise exception 'This invitation belongs to a different email address.';
  end if;

  insert into public.org_memberships (org_id, user_id, role, invited_by, joined_at)
  values (invite.org_id, auth.uid(), invite.role, invite.invited_by, now())
  on conflict (org_id, user_id) do update
  set role = excluded.role,
      joined_at = now();

  update public.org_invitations set accepted_at = now() where id = invite.id;

  return invite.org_id;
end;
$$;

create or replace function public.change_member_role(target_membership_id uuid, next_role public.org_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.org_memberships%rowtype;
begin
  select * into target from public.org_memberships where id = target_membership_id;
  if target.id is null then
    raise exception 'Membership not found.';
  end if;
  if not public.is_org_admin(target.org_id) then
    raise exception 'Admin access required.';
  end if;
  if target.role = 'admin' and next_role <> 'admin' then
    perform public.assert_last_admin_safe(target.org_id, target.user_id);
  end if;

  update public.org_memberships set role = next_role where id = target_membership_id;
end;
$$;

create or replace function public.remove_org_member(target_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.org_memberships%rowtype;
begin
  select * into target from public.org_memberships where id = target_membership_id;
  if target.id is null then
    raise exception 'Membership not found.';
  end if;
  if not public.is_org_admin(target.org_id) then
    raise exception 'Admin access required.';
  end if;

  perform public.assert_last_admin_safe(target.org_id, target.user_id);
  delete from public.org_memberships where id = target_membership_id;
end;
$$;

create or replace function public.revoke_org_invitation(target_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org_id uuid;
begin
  select org_id into target_org_id from public.org_invitations where id = target_invitation_id;
  if target_org_id is null then
    raise exception 'Invitation not found.';
  end if;
  if not public.is_org_admin(target_org_id) then
    raise exception 'Admin access required.';
  end if;
  update public.org_invitations set revoked_at = now() where id = target_invitation_id;
end;
$$;

alter table public.users enable row level security;
alter table public.organizations enable row level security;
alter table public.org_memberships enable row level security;
alter table public.org_invitations enable row level security;
alter table public.animal_classes enable row level security;
alter table public.tags enable row level security;
alter table public.task_category_templates enable row level security;
alter table public.task_template_tags enable row level security;
alter table public.animals enable row level security;
alter table public.animal_tasks enable row level security;
alter table public.animal_task_tags enable row level security;
alter table public.food_items enable row level security;
alter table public.task_log_entries enable row level security;
alter table public.food_log_items enable row level security;

create policy "Users can read themselves" on public.users for select using (id = auth.uid());
create policy "Users can update themselves" on public.users for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Members can read organizations" on public.organizations for select using (public.is_org_member(id));
create policy "Admins can update organizations" on public.organizations for update using (public.is_org_admin(id)) with check (public.is_org_admin(id));

create policy "Members can read org memberships" on public.org_memberships for select using (public.is_org_member(org_id));

create policy "Admins can read org invitations" on public.org_invitations for select using (public.is_org_admin(org_id));

create policy "Members can read animal classes" on public.animal_classes for select using (public.is_org_member(org_id));
create policy "Admins can manage animal classes" on public.animal_classes for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy "Members can read tags" on public.tags for select using (public.is_org_member(org_id));
create policy "Admins can manage tags" on public.tags for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy "Members can read templates" on public.task_category_templates for select using (
  exists (select 1 from public.animal_classes c where c.id = class_id and public.is_org_member(c.org_id))
);
create policy "Admins can manage templates" on public.task_category_templates for all using (
  exists (select 1 from public.animal_classes c where c.id = class_id and public.is_org_admin(c.org_id))
) with check (
  exists (select 1 from public.animal_classes c where c.id = class_id and public.is_org_admin(c.org_id))
);

create policy "Members can read template tags" on public.task_template_tags for select using (
  exists (
    select 1
    from public.task_category_templates t
    join public.animal_classes c on c.id = t.class_id
    where t.id = task_template_id and public.is_org_member(c.org_id)
  )
);
create policy "Admins can manage template tags" on public.task_template_tags for all using (
  exists (
    select 1
    from public.task_category_templates t
    join public.animal_classes c on c.id = t.class_id
    where t.id = task_template_id and public.is_org_admin(c.org_id)
  )
) with check (
  exists (
    select 1
    from public.task_category_templates t
    join public.animal_classes c on c.id = t.class_id
    where t.id = task_template_id and public.is_org_admin(c.org_id)
  )
);

create policy "Members can read animals" on public.animals for select using (public.is_org_member(org_id));
create policy "Admins can manage animals" on public.animals for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy "Members can read animal tasks" on public.animal_tasks for select using (
  exists (select 1 from public.animals a where a.id = animal_id and public.is_org_member(a.org_id))
);
create policy "Members can add animal tasks" on public.animal_tasks for insert with check (
  exists (select 1 from public.animals a where a.id = animal_id and public.is_org_member(a.org_id))
);
create policy "Members can update animal tasks" on public.animal_tasks for update using (
  exists (select 1 from public.animals a where a.id = animal_id and public.is_org_member(a.org_id))
) with check (
  exists (select 1 from public.animals a where a.id = animal_id and public.is_org_member(a.org_id))
);
create policy "Admins can delete animal tasks" on public.animal_tasks for delete using (
  exists (select 1 from public.animals a where a.id = animal_id and public.is_org_admin(a.org_id))
);

create policy "Members can read animal task tags" on public.animal_task_tags for select using (
  exists (
    select 1 from public.animal_tasks at
    join public.animals a on a.id = at.animal_id
    where at.id = animal_task_id and public.is_org_member(a.org_id)
  )
);
create policy "Members can manage animal task tags" on public.animal_task_tags for all using (
  exists (
    select 1 from public.animal_tasks at
    join public.animals a on a.id = at.animal_id
    where at.id = animal_task_id and public.is_org_member(a.org_id)
  )
) with check (
  exists (
    select 1 from public.animal_tasks at
    join public.animals a on a.id = at.animal_id
    where at.id = animal_task_id and public.is_org_member(a.org_id)
  )
);

create policy "Members can read food items" on public.food_items for select using (public.is_org_member(org_id));
create policy "Admins can manage food items" on public.food_items for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy "Members can read task logs" on public.task_log_entries for select using (
  exists (select 1 from public.animals a where a.id = animal_id and public.is_org_member(a.org_id))
);
create policy "Members can create task logs" on public.task_log_entries for insert with check (
  created_by = auth.uid() and exists (select 1 from public.animals a where a.id = animal_id and public.is_org_member(a.org_id))
);
create policy "Members can update task logs" on public.task_log_entries for update using (
  exists (select 1 from public.animals a where a.id = animal_id and public.is_org_member(a.org_id))
) with check (
  exists (select 1 from public.animals a where a.id = animal_id and public.is_org_member(a.org_id))
);

create policy "Members can read food log items" on public.food_log_items for select using (
  exists (
    select 1 from public.task_log_entries l
    join public.animals a on a.id = l.animal_id
    where l.id = log_entry_id and public.is_org_member(a.org_id)
  )
);
create policy "Members can manage food log items" on public.food_log_items for all using (
  exists (
    select 1 from public.task_log_entries l
    join public.animals a on a.id = l.animal_id
    where l.id = log_entry_id and public.is_org_member(a.org_id)
  )
) with check (
  exists (
    select 1 from public.task_log_entries l
    join public.animals a on a.id = l.animal_id
    where l.id = log_entry_id and public.is_org_member(a.org_id)
  )
);
