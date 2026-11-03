-- Run after wrestler_profile_reigns.sql in the Supabase SQL Editor.
-- Creates an isolated test career, exercises authenticated RLS, then rolls back.
begin;
do $setup$
declare
  v_owner uuid;
  v_game uuid := gen_random_uuid();
  v_other_game uuid := gen_random_uuid();
  v_wrestler uuid := gen_random_uuid();
  v_partner_a uuid := gen_random_uuid();
  v_partner_b uuid := gen_random_uuid();
  v_world uuid := gen_random_uuid();
  v_tag uuid := gen_random_uuid();
  v_mitb uuid := gen_random_uuid();
  v_reigns uuid[] := array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
  v_event uuid;
  v_segment uuid;
  v_format text;
  v_index integer;
begin
  select id into v_owner from auth.users order by created_at limit 1;
  if v_owner is null then raise exception 'An existing auth user is required.'; end if;
  select id into v_format from public.wc_match_formats order by id limit 1;
  if v_format is null then raise exception 'A match format is required.'; end if;

  insert into public.wc_games (id, owner_id, name, mode, current_tick)
  values (v_game, v_owner, 'Reign history verification (rolled back)', 'mygm', 20),
    (v_other_game, v_owner, 'Other test career (rolled back)', 'mygm', 20);
  insert into public.wc_game_wrestlers (id, game_id, name, gender, role)
  values (v_wrestler, v_game, 'Test wrestler', 'male', 'face'),
    (v_partner_a, v_game, 'First partner', 'male', 'face'),
    (v_partner_b, v_game, 'Second partner', 'male', 'face');
  insert into public.wc_game_titles (id, game_id, name, gender, division, category, is_active)
  values (v_world, v_game, 'Test world title', 'male', 'singles', 'world', true),
    (v_tag, v_game, 'Retired tag title', 'male', 'tag_team', 'tag_team', false),
    (v_mitb, v_game, 'Test MITB', 'male', 'singles', 'mitb', true);
  insert into public.wc_title_reigns (id, game_id, title_id, won_tick, lost_tick)
  values (v_reigns[1], v_game, v_world, 2, 3),
    (v_reigns[2], v_game, v_world, 4, 4),
    (v_reigns[3], v_game, v_world, 5, null),
    (v_reigns[4], v_game, v_tag, 1, 6),
    (v_reigns[5], v_game, v_tag, 8, 12),
    (v_reigns[6], v_game, v_mitb, 10, null);
  insert into public.wc_reign_holders (game_id, reign_id, wrestler_id)
  select v_game, reign_id, v_wrestler from unnest(v_reigns) reign_id;
  insert into public.wc_reign_holders (game_id, reign_id, wrestler_id)
  values (v_game, v_reigns[4], v_partner_a), (v_game, v_reigns[5], v_partner_b);

  -- Two completed defenses and one draft must count as exactly two defenses.
  for v_index in 1..3 loop
    v_event := gen_random_uuid();
    v_segment := gen_random_uuid();
    insert into public.wc_events (id, game_id, name, kind, tick, status)
    values (v_event, v_game, 'Test defense', 'weekly', 8 + v_index,
      case when v_index = 3 then 'draft' else 'completed' end);
    insert into public.wc_segments (id, game_id, event_id, position, kind)
    values (v_segment, v_game, v_event, 1, 'match');
    insert into public.wc_matches (segment_id, game_id, format_id)
    values (v_segment, v_game, v_format);
    insert into public.wc_title_defenses (game_id, reign_id, segment_id)
    values (v_game, v_reigns[3], v_segment);
  end loop;

  perform set_config('wc.reign_test', jsonb_build_object('owner', v_owner, 'game', v_game,
    'other_game', v_other_game, 'wrestler', v_wrestler, 'partner_a', v_partner_a,
    'partner_b', v_partner_b, 'world', v_world)::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_owner::text, true);
end;
$setup$;

set local role authenticated;
do $test$
declare
  v_context jsonb := current_setting('wc.reign_test')::jsonb;
  v_game uuid := (v_context ->> 'game')::uuid;
  v_wrestler uuid := (v_context ->> 'wrestler')::uuid;
  v_profile jsonb;
  v_history jsonb;
  v_failed boolean;
begin
  v_profile := public.wc_get_mygm_wrestler_profile_with_reigns(v_game, v_wrestler, 1);
  v_history := v_profile -> 'championship_history';
  if jsonb_array_length(v_history) <> 6 then raise exception 'Reigns were lost or grouped by title.'; end if;
  if (select count(*) from jsonb_array_elements(v_history) r where r ->> 'id' = v_context ->> 'world') <> 3 then
    raise exception 'Repeated reigns of one championship were collapsed.';
  end if;
  if not exists (select 1 from jsonb_array_elements(v_history) r
    where r ->> 'won_tick' = '4' and r ->> 'lost_tick' = '4' and r ->> 'duration_weeks' = '0' and r ->> 'status' = 'completed') then
    raise exception 'A same-week reign was lost.';
  end if;
  if not exists (select 1 from jsonb_array_elements(v_history) r
    where r ->> 'won_tick' = '5' and r ->> 'duration_weeks' = '15' and r ->> 'defenses' = '2' and r ->> 'status' = 'current') then
    raise exception 'Current duration or completed defense count is invalid.';
  end if;
  if not exists (select 1 from jsonb_array_elements(v_history) r
    where r ->> 'category' = 'tag_team' and r ->> 'won_tick' = '1'
      and r -> 'holders' @> jsonb_build_array(jsonb_build_object('id', v_context ->> 'partner_a')))
    or not exists (select 1 from jsonb_array_elements(v_history) r
    where r ->> 'category' = 'tag_team' and r ->> 'won_tick' = '8'
      and r -> 'holders' @> jsonb_build_array(jsonb_build_object('id', v_context ->> 'partner_b'))) then
    raise exception 'Historical tag partners are missing or mixed.';
  end if;
  if not exists (select 1 from jsonb_array_elements(v_history) r
    where r ->> 'category' = 'mitb' and r ->> 'defenses' = '0' and r ->> 'status' = 'current') then
    raise exception 'MITB possession is missing or incorrectly classified.';
  end if;

  v_failed := false;
  begin
    perform public.wc_get_mygm_wrestler_profile_with_reigns((v_context ->> 'other_game')::uuid, v_wrestler, 5);
  exception when others then
    if sqlerrm <> 'Wrestler could not be found.' then raise; end if;
    v_failed := true;
  end;
  if not v_failed then raise exception 'Cross-career wrestler lookup was allowed.'; end if;

  perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', current_setting('request.jwt.claim.sub'), 'role', 'authenticated')::text, true);
  v_failed := false;
  begin
    perform public.wc_get_mygm_wrestler_profile_with_reigns(v_game, v_wrestler, 5);
  exception when others then
    if sqlerrm <> 'Career could not be found.' then raise; end if;
    v_failed := true;
  end;
  if not v_failed then raise exception 'Cross-owner profile access was allowed.'; end if;
  if has_function_privilege('anon', 'public.wc_get_mygm_wrestler_profile_with_reigns(uuid,uuid,integer)', 'EXECUTE') then
    raise exception 'Anonymous callers can execute the profile RPC.';
  end if;
  raise notice 'Reign history checks passed; all test fixtures will be rolled back.';
end;
$test$;
reset role;
rollback;
