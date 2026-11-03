-- Run in the Supabase SQL Editor before using the rivalry editor.
-- Based on the schema and functions shared in "Enfocar chat en Supabase".
begin;

create table public.wc_mygm_rivalry_requests (
  game_id uuid not null references public.wc_games(id) on delete cascade,
  request_id uuid not null,
  payload jsonb not null,
  feud_id uuid not null references public.wc_feuds(id) on delete cascade,
  primary key (game_id, request_id)
);

alter table public.wc_mygm_rivalry_requests enable row level security;
create policy rivalry_requests_select on public.wc_mygm_rivalry_requests
  for select to authenticated using (exists (
    select 1 from public.wc_games g
    where g.id = game_id and g.owner_id = (select auth.uid()) and g.mode = 'mygm'
  ));
create policy rivalry_requests_insert on public.wc_mygm_rivalry_requests
  for insert to authenticated with check (exists (
    select 1 from public.wc_games g
    where g.id = game_id and g.owner_id = (select auth.uid()) and g.mode = 'mygm'
  ) and exists (
    select 1 from public.wc_feuds f where f.id = feud_id and f.game_id = wc_mygm_rivalry_requests.game_id
  ));
revoke all on public.wc_mygm_rivalry_requests from public, anon;
grant select, insert on public.wc_mygm_rivalry_requests to authenticated;

create or replace function public.wc_save_mygm_rivalry(
  p_game_id uuid,
  p_feud_id uuid,
  p_request_id uuid,
  p_kind text,
  p_level integer,
  p_started_tick integer,
  p_participants jsonb
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_game public.wc_games%rowtype;
  v_feud public.wc_feuds%rowtype;
  v_request public.wc_mygm_rivalry_requests%rowtype;
  v_payload jsonb;
  v_members jsonb;
  v_side_size integer;
  v_started_tick integer;
  v_feud_id uuid;
  v_first_ids uuid[];
  v_second_ids uuid[];
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  -- Use the same career lock as booking and show completion.
  select * into v_game from public.wc_games
  where id = p_game_id and owner_id = auth.uid() and mode = 'mygm'
  for update;
  if not found then raise exception 'Career could not be found.'; end if;
  if p_request_id is null then raise exception 'A request ID is required.'; end if;
  if p_kind is null or p_kind not in ('singles', 'tag_team') then
    raise exception 'Choose a 1v1 or 2v2 rivalry.';
  end if;
  if p_level is null or p_level not between 1 and 4 then
    raise exception 'The rivalry level must be between 1 and 4.';
  end if;
  if p_participants is null or jsonb_typeof(p_participants) <> 'array' then
    raise exception 'The participants must be an array.';
  end if;
  v_side_size := case when p_kind = 'singles' then 1 else 2 end;
  if jsonb_array_length(p_participants) <> v_side_size * 2 then
    raise exception 'The rivalry sides have invalid participant counts.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_participants) m
    where jsonb_typeof(m) <> 'object'
      or jsonb_typeof(m -> 'wrestler_id') is distinct from 'string'
      or coalesce(m ->> 'wrestler_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or jsonb_typeof(m -> 'side') is distinct from 'number'
      or coalesce(m ->> 'side', '') not in ('1', '2')
  ) then raise exception 'A rivalry participant is invalid.'; end if;

  select jsonb_agg(jsonb_build_object('wrestler_id', (m ->> 'wrestler_id')::uuid, 'side', (m ->> 'side')::integer)
    order by (m ->> 'side')::integer, (m ->> 'wrestler_id')::uuid)
  into v_members from jsonb_array_elements(p_participants) m;

  if (select count(distinct (m ->> 'wrestler_id')::uuid) from jsonb_array_elements(v_members) m) <> v_side_size * 2
    or (select count(*) from jsonb_array_elements(v_members) m where m ->> 'side' = '1') <> v_side_size
    or (select count(*) from jsonb_array_elements(v_members) m where m ->> 'side' = '2') <> v_side_size then
    raise exception 'Select distinct participants with equal sides.';
  end if;

  v_payload := jsonb_build_object('feud_id', p_feud_id, 'kind', p_kind,
    'level', p_level, 'started_tick', p_started_tick, 'participants', v_members);
  select * into v_request from public.wc_mygm_rivalry_requests
  where game_id = p_game_id and request_id = p_request_id;
  if found then
    if v_request.payload <> v_payload then
      raise exception 'This request ID was already used for different changes.';
    end if;
    return v_request.feud_id;
  end if;

  perform public.wc_assert_mygm_season_ready(p_game_id);
  if (select count(*) from public.wc_game_brands where game_id = p_game_id) <> 1 then
    raise exception 'This career must have exactly one brand.';
  end if;
  if p_feud_id is not null then
    select * into v_feud from public.wc_feuds
    where game_id = p_game_id and id = p_feud_id for update;
    if not found then raise exception 'Rivalry could not be found.'; end if;
    if v_feud.kind not in ('singles', 'tag_team') then
      raise exception 'This rivalry type cannot be edited here.';
    end if;
  end if;

  -- A missing week is resolved by the server, using the locked career clock.
  v_started_tick := coalesce(p_started_tick, v_game.current_tick);
  if v_started_tick < 1 or v_started_tick > coalesce(v_feud.ended_tick, v_game.current_tick) then
    raise exception 'The start must be no later than the current week or rivalry end.';
  end if;
  if exists (select 1 from public.wc_feud_log
    where game_id = p_game_id and feud_id = p_feud_id
      and segment_id is not null and tick < v_started_tick) then
    raise exception 'The start cannot be after an existing rivalry show appearance.';
  end if;

  if exists (
    select 1 from jsonb_array_elements(v_members) m
    where not exists (select 1 from public.wc_game_wrestlers w
      where w.game_id = p_game_id and w.id = (m ->> 'wrestler_id')::uuid)
  ) then raise exception 'A participant does not belong to this career.'; end if;

  -- Keep existing members available; newly added members must be on the current roster.
  if exists (
    select 1 from jsonb_array_elements(v_members) m
    where not exists (select 1 from public.wc_feud_members fm
      where fm.game_id = p_game_id and fm.feud_id = p_feud_id
        and fm.wrestler_id = (m ->> 'wrestler_id')::uuid)
    and not exists (select 1 from public.wc_roster_memberships rm
      join public.wc_game_brands b on b.game_id = rm.game_id and b.id = rm.brand_id
      where rm.game_id = p_game_id and rm.wrestler_id = (m ->> 'wrestler_id')::uuid
        and rm.joined_tick <= v_game.current_tick
        and (rm.left_tick is null or rm.left_tick > v_game.current_tick)
        and (rm.contract_end_tick is null or rm.contract_end_tick >= v_game.current_tick)
    )
  ) then raise exception 'A new participant is no longer available on this roster.'; end if;

  select array_agg((m ->> 'wrestler_id')::uuid order by (m ->> 'wrestler_id')::uuid) filter (where m ->> 'side' = '1'),
    array_agg((m ->> 'wrestler_id')::uuid order by (m ->> 'wrestler_id')::uuid) filter (where m ->> 'side' = '2')
  into v_first_ids, v_second_ids from jsonb_array_elements(v_members) m;
  if coalesce(v_feud.status, 'active') = 'active' and exists (
    select 1 from public.wc_feuds f
    cross join lateral (
      select array_agg(fm.wrestler_id order by fm.wrestler_id) filter (where fm.side = 1) first_ids,
        array_agg(fm.wrestler_id order by fm.wrestler_id) filter (where fm.side = 2) second_ids
      from public.wc_feud_members fm where fm.game_id = f.game_id and fm.feud_id = f.id
    ) members
    where f.game_id = p_game_id and f.id is distinct from p_feud_id
      and f.kind = p_kind and f.status = 'active'
      and ((members.first_ids = v_first_ids and members.second_ids = v_second_ids)
        or (members.first_ids = v_second_ids and members.second_ids = v_first_ids))
  ) then raise exception 'These participants already have an active rivalry.'; end if;

  v_feud_id := coalesce(p_feud_id, pg_catalog.gen_random_uuid());
  if p_feud_id is null then
    insert into public.wc_feuds (id, game_id, kind, level, status, started_tick)
    values (v_feud_id, p_game_id, p_kind, p_level, 'active', v_started_tick);
  else
    update public.wc_feuds set kind = p_kind, level = p_level, started_tick = v_started_tick
    where game_id = p_game_id and id = v_feud_id;
    delete from public.wc_feud_members where game_id = p_game_id and feud_id = v_feud_id;
  end if;
  insert into public.wc_feud_members (game_id, feud_id, wrestler_id, side)
  select p_game_id, v_feud_id, (m ->> 'wrestler_id')::uuid, (m ->> 'side')::smallint
  from jsonb_array_elements(v_members) m;

  insert into public.wc_feud_log (game_id, feud_id, tick, kind, new_level, notes)
  values (p_game_id, v_feud_id, v_game.current_tick,
    case when p_feud_id is not null and v_feud.level <> p_level then 'level_change' else 'note' end,
    p_level::smallint,
    case when p_feud_id is null then
      pg_catalog.format('Rivalry created manually at level %s. Start: season %s, week %s.',
        p_level, ((v_started_tick - 1) / 50) + 1, mod(v_started_tick - 1, 50) + 1)
    else
      pg_catalog.format('Rivalry edited manually. Level: %s to %s. Start: season %s, week %s to season %s, week %s. Participants were saved with this edit.',
        v_feud.level, p_level, ((v_feud.started_tick - 1) / 50) + 1, mod(v_feud.started_tick - 1, 50) + 1,
        ((v_started_tick - 1) / 50) + 1, mod(v_started_tick - 1, 50) + 1)
    end);
  insert into public.wc_mygm_rivalry_requests (game_id, request_id, payload, feud_id)
  values (p_game_id, p_request_id, v_payload, v_feud_id);
  return v_feud_id;
end;
$function$;

revoke all on function public.wc_save_mygm_rivalry(uuid, uuid, uuid, text, integer, integer, jsonb) from public, anon;
grant execute on function public.wc_save_mygm_rivalry(uuid, uuid, uuid, text, integer, integer, jsonb) to authenticated;
commit;
