begin;

do $setup$
declare
  v_owner uuid;
  v_game uuid := gen_random_uuid();
  v_other_game uuid := gen_random_uuid();
  v_title uuid := gen_random_uuid();
  v_other_title uuid := gen_random_uuid();
  v_name text := 'SmackDown Temporáda ' || replace(gen_random_uuid()::text, '-', '');
  v_slug text;
begin
  select id into v_owner from auth.users order by created_at limit 1;
  if v_owner is null then raise exception 'An existing auth user is required.'; end if;

  insert into public.wc_games (id, owner_id, name, mode, current_tick)
  values (v_game, v_owner, v_name, 'mygm', 1)
  returning slug into v_slug;
  insert into public.wc_games (id, owner_id, name, mode, current_tick)
  values (v_other_game, v_owner, v_name, 'mygm', 1);

  if v_slug not like 'smackdown-temporada-%' or not exists (
    select 1 from public.wc_games where id = v_other_game and slug = v_slug || '-2'
  ) then raise exception 'Career slug normalization or deduplication failed.'; end if;

  insert into public.wc_game_titles (id, game_id, name, gender, division, category, is_active)
  values (v_title, v_game, 'Women''s Tag Team', 'female', 'tag_team', 'tag_team', true);
  insert into public.wc_game_titles (id, game_id, name, gender, division, category, is_active)
  values (gen_random_uuid(), v_game, 'Womens Tag Team', 'female', 'tag_team', 'tag_team', false),
    (v_other_title, v_other_game, 'Women''s Tag Team', 'female', 'tag_team', 'tag_team', true);

  if not exists (
    select 1 from public.wc_game_titles where game_id = v_game and slug = 'womens-tag-team-2'
  ) then raise exception 'Title deduplication failed.'; end if;

  update public.wc_games set name = 'Renamed career', slug = 'manual' where id = v_game;
  update public.wc_game_titles set name = 'Renamed title', slug = 'manual' where id = v_title;

  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_owner::text, true);
  perform set_config('wc.slug_test', jsonb_build_object(
    'game', v_game, 'slug', v_slug, 'title', v_title, 'other_title', v_other_title
  )::text, true);
end;
$setup$;

set local role authenticated;
do $test$
declare
  v_context jsonb := current_setting('wc.slug_test')::jsonb;
  v_game text := v_context ->> 'game';
  v_slug text := v_context ->> 'slug';
  v_title text := v_context ->> 'title';
begin
  if not exists (
    select 1 from public.wc_resolve_mygm_route(v_game)
    where career_id = v_game::uuid and career_slug = v_slug and title_id is null
  ) then raise exception 'Legacy career lookup or rename stability failed.'; end if;

  if not exists (
    select 1 from public.wc_resolve_mygm_route(v_slug, 'womens-tag-team')
    where title_id = v_title::uuid
  ) or not exists (
    select 1 from public.wc_resolve_mygm_route(v_game, v_title)
    where title_slug = 'womens-tag-team'
  ) then raise exception 'Title lookup or rename stability failed.'; end if;

  if exists (select 1 from public.wc_resolve_mygm_route(v_slug, v_context ->> 'other_title')) then
    raise exception 'A title resolved under the wrong career.';
  end if;

  perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', current_setting('request.jwt.claim.sub'), 'role', 'authenticated'
  )::text, true);
  if exists (select 1 from public.wc_resolve_mygm_route(v_game))
    or exists (select 1 from public.wc_resolve_mygm_route(v_slug, 'womens-tag-team')) then
    raise exception 'A non-owner resolved a private career or title.';
  end if;
end;
$test$;

rollback;
