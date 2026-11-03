-- Run AFTER manage_mygm_rivalry.sql in the Supabase SQL Editor.
-- Creates an isolated test career for an existing auth user. Always rolls back.
-- Tests actual authenticated grants/RLS, not a privileged function invocation.
begin;
do $setup$
declare
  v_owner uuid;
  v_game uuid := gen_random_uuid();
  v_feud uuid := gen_random_uuid();
  v_inactive uuid := gen_random_uuid();
  v_event uuid := gen_random_uuid();
  v_segment uuid := gen_random_uuid();
  v_first uuid := gen_random_uuid();
  v_second uuid := gen_random_uuid();
  v_format text;
begin
  select id into v_owner from auth.users order by created_at limit 1;
  if v_owner is null then raise exception 'A test auth user is required.'; end if;
  select id into v_format from public.wc_match_formats order by id limit 1;
  if v_format is null then raise exception 'A match format is required for this test.'; end if;

  insert into public.wc_games (id, owner_id, name, mode, current_tick)
  values (v_game, v_owner, 'Rivalry action verification (rolled back)', 'mygm', 10);
  insert into public.wc_game_wrestlers (id, game_id, name, gender, role)
  values (v_first, v_game, 'Verification A', 'male', 'face'),
    (v_second, v_game, 'Verification B', 'male', 'heel');
  insert into public.wc_feuds (id, game_id, kind, level, status, started_tick)
  values (v_feud, v_game, 'singles', 2, 'active', 5),
    (v_inactive, v_game, 'singles', 1, 'stale', 1);
  insert into public.wc_feud_members (game_id, feud_id, wrestler_id, side)
  values (v_game, v_feud, v_first, 1), (v_game, v_feud, v_second, 2);
  insert into public.wc_events (id, game_id, name, kind, tick, status)
  values (v_event, v_game, 'Verification show', 'weekly', 9, 'completed');
  insert into public.wc_segments (id, game_id, event_id, position, kind, feud_id, rating)
  values (v_segment, v_game, v_event, 1, 'match', v_feud, 4);
  insert into public.wc_matches (segment_id, game_id, format_id, outcome)
  values (v_segment, v_game, v_format, 'decisive');
  insert into public.wc_match_participants (game_id, segment_id, wrestler_id, side, result)
  values (v_game, v_segment, v_first, 1, 'winner'), (v_game, v_segment, v_second, 2, 'loser');
  insert into public.wc_feud_log (game_id, feud_id, tick, segment_id, kind, new_level)
  values (v_game, v_feud, 9, v_segment, 'match', 2);
  insert into public.wc_mygm_rivalry_requests (game_id, request_id, payload, feud_id)
  values (v_game, gen_random_uuid(), '{}'::jsonb, v_feud);
  perform set_config('wc.rivalry_test', jsonb_build_object('owner', v_owner, 'game', v_game,
    'feud', v_feud, 'inactive', v_inactive, 'event', v_event, 'segment', v_segment)::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_owner::text, true);
end;
$setup$;

set local role authenticated;
do $test$
declare
  v_context jsonb := current_setting('wc.rivalry_test')::jsonb;
  v_game uuid := (v_context ->> 'game')::uuid;
  v_feud uuid := (v_context ->> 'feud')::uuid;
  v_segment uuid := (v_context ->> 'segment')::uuid;
  v_failed boolean;
begin
  if has_function_privilege('anon', 'public.wc_manage_mygm_rivalry(uuid,uuid,text,integer)', 'EXECUTE') then
    raise exception 'Anonymous callers must not execute this function.';
  end if;
  perform public.wc_manage_mygm_rivalry(v_game, v_feud, 'resolve', 1);
  perform public.wc_manage_mygm_rivalry(v_game, v_feud, 'resolve', 1);
  if not exists (select 1 from public.wc_feuds where id = v_feud and game_id = v_game
    and status = 'resolved' and ended_tick = 10 and winning_side = 1 and level = 2 and started_tick = 5)
    or (select count(*) from public.wc_feud_log where game_id = v_game and feud_id = v_feud and kind = 'resolution') <> 1
    or (select count(*) from public.wc_feud_members where game_id = v_game and feud_id = v_feud) <> 2 then
    raise exception 'Finish, history retention or retry protection failed.';
  end if;

  v_failed := false;
  begin
    perform public.wc_manage_mygm_rivalry(v_game, v_feud, 'resolve', 2);
  exception when others then
    if sqlerrm <> 'Only an active rivalry can be finished.' then raise; end if;
    v_failed := true;
  end;
  if not v_failed then raise exception 'Resolved winner was incorrectly overwritten.'; end if;

  v_failed := false;
  begin
    perform public.wc_manage_mygm_rivalry(v_game, (v_context ->> 'inactive')::uuid, 'resolve', null);
  exception when others then
    if sqlerrm <> 'Only an active rivalry can be finished.' then raise; end if;
    v_failed := true;
  end;
  if not v_failed then raise exception 'Inactive rivalry was incorrectly finished.'; end if;

  -- Simulate another authenticated owner. Ownership check must reject deletion.
  perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', current_setting('request.jwt.claim.sub'), 'role', 'authenticated')::text, true);
  v_failed := false;
  begin
    perform public.wc_manage_mygm_rivalry(v_game, v_feud, 'delete', null);
  exception when others then
    if sqlerrm <> 'Career could not be found.' then raise; end if;
    v_failed := true;
  end;
  if not v_failed then raise exception 'Cross-owner deletion was allowed.'; end if;
  perform set_config('request.jwt.claim.sub', v_context ->> 'owner', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_context ->> 'owner', 'role', 'authenticated')::text, true);

  perform public.wc_manage_mygm_rivalry(v_game, v_feud, 'delete', null);
  perform public.wc_manage_mygm_rivalry(v_game, v_feud, 'delete', null);
  if exists (select 1 from public.wc_feuds where game_id = v_game and id = v_feud)
    or exists (select 1 from public.wc_feud_members where game_id = v_game and feud_id = v_feud)
    or exists (select 1 from public.wc_feud_log where game_id = v_game and feud_id = v_feud)
    or exists (select 1 from public.wc_mygm_rivalry_requests where game_id = v_game and feud_id = v_feud) then
    raise exception 'Rivalry deletion did not remove all rivalry data.';
  end if;
  if not exists (select 1 from public.wc_segments where game_id = v_game and id = v_segment and feud_id is null and rating = 4)
    or not exists (select 1 from public.wc_matches where game_id = v_game and segment_id = v_segment and outcome = 'decisive')
    or (select count(*) from public.wc_match_participants where game_id = v_game and segment_id = v_segment and result in ('winner', 'loser')) <> 2
    or not exists (select 1 from public.wc_events where game_id = v_game and id = (v_context ->> 'event')::uuid and status = 'completed') then
    raise exception 'Deleting a rivalry damaged the show or match results.';
  end if;
  raise notice 'Rivalry lifecycle checks passed; all test data will be rolled back.';
end;
$test$;
reset role;
rollback;
