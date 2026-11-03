-- Run once in the SQL Editor after save_mygm_rivalry.sql.
-- Does not change the existing creation/editing function or its request table.
begin;

create or replace function public.wc_manage_mygm_rivalry(
  p_game_id uuid,
  p_feud_id uuid,
  p_action text,
  p_winning_side integer default null
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_game public.wc_games%rowtype;
  v_feud public.wc_feuds%rowtype;
  v_changed_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;
  if p_feud_id is null then raise exception 'A rivalry ID is required.'; end if;
  if p_action is null or p_action not in ('resolve', 'delete') then
    raise exception 'The rivalry action is invalid.';
  end if;
  if p_winning_side is not null and p_winning_side not in (1, 2) then
    raise exception 'The winning side is invalid.';
  end if;
  if p_action = 'delete' and p_winning_side is not null then
    raise exception 'A deletion cannot assign a winner.';
  end if;

  -- Same lock and ownership boundary as booking, creation and editing.
  select * into v_game from public.wc_games
  where id = p_game_id and owner_id = auth.uid() and mode = 'mygm'
  for update;
  if not found then raise exception 'Career could not be found.'; end if;

  select * into v_feud from public.wc_feuds
  where game_id = p_game_id and id = p_feud_id for update;
  if not found then
    -- Repeating a completed deletion is safe, including after a lost response.
    if p_action = 'delete' then return p_feud_id; end if;
    raise exception 'Rivalry could not be found.';
  end if;

  if p_action = 'resolve' then
    -- Retrying the same finish must not append another resolution entry.
    if v_feud.status = 'resolved' and v_feud.winning_side is not distinct from p_winning_side then
      return p_feud_id;
    end if;
    if v_feud.status <> 'active' then
      raise exception 'Only an active rivalry can be finished.';
    end if;
    perform public.wc_assert_mygm_season_ready(p_game_id);
    if v_feud.started_tick > v_game.current_tick then
      raise exception 'The rivalry cannot end before its start.';
    end if;
    if p_winning_side is not null and not exists (
      select 1 from public.wc_feud_members
      where game_id = p_game_id and feud_id = p_feud_id and side = p_winning_side
    ) then raise exception 'The winning side has no participants.'; end if;

    update public.wc_feuds
    set status = 'resolved', ended_tick = v_game.current_tick,
      winning_side = p_winning_side::smallint
    where game_id = p_game_id and id = p_feud_id
    returning id into v_changed_id;
    if v_changed_id is null then raise exception 'The rivalry could not be finished.'; end if;

    insert into public.wc_feud_log (game_id, feud_id, tick, kind, new_level, notes)
    values (p_game_id, p_feud_id, v_game.current_tick, 'resolution', v_feud.level,
      'Rivalry finished manually from the rivalries screen.');
  else
    -- Preserve all events, match/promo segments, participants and results.
    -- Only remove the live rivalry link and the rivalry's own data.
    update public.wc_segments set feud_id = null
    where game_id = p_game_id and feud_id = p_feud_id;
    delete from public.wc_feud_log where game_id = p_game_id and feud_id = p_feud_id;
    delete from public.wc_feud_members where game_id = p_game_id and feud_id = p_feud_id;
    -- wc_mygm_rivalry_requests rows cascade through the feud_id foreign key.
    delete from public.wc_feuds where game_id = p_game_id and id = p_feud_id
    returning id into v_changed_id;
    if v_changed_id is null then raise exception 'The rivalry could not be deleted.'; end if;
  end if;

  return p_feud_id;
end;
$function$;

revoke all on function public.wc_manage_mygm_rivalry(uuid, uuid, text, integer) from public, anon;
grant execute on function public.wc_manage_mygm_rivalry(uuid, uuid, text, integer) to authenticated;
commit;
