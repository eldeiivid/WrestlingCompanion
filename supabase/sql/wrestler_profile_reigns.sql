-- Run once in Supabase SQL Editor. Adds a read-only RPC; keeps the original
-- profile function intact so market/catalog consumers retain their contract.
begin;

create or replace function public.wc_get_mygm_wrestler_profile_with_reigns(
  p_game_id uuid,
  p_wrestler_id uuid,
  p_history_limit integer default 5
) returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $function$
declare
  v_current_tick integer;
  v_profile jsonb;
  v_history jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication is required.'; end if;
  select current_tick into v_current_tick from public.wc_games
  where id = p_game_id and owner_id = auth.uid() and mode = 'mygm';
  if not found then raise exception 'Career could not be found.'; end if;
  if not exists (select 1 from public.wc_game_wrestlers
    where game_id = p_game_id and id = p_wrestler_id) then
    raise exception 'Wrestler could not be found.';
  end if;

  v_profile := public.wc_get_mygm_wrestler_profile(p_game_id, p_wrestler_id, p_history_limit);

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'image_url', t.image_url,
      'category', t.category,
      'division', t.division,
      'reign_id', r.id,
      'won_tick', r.won_tick,
      'lost_tick', r.lost_tick,
      'status', case when r.lost_tick is null then 'current' else 'completed' end,
      'duration_weeks', greatest(0, coalesce(r.lost_tick, v_current_tick) - r.won_tick),
      -- MITB represents briefcase possession, not a championship reign.
      'defenses', case when t.category = 'mitb' then 0 else (
        select count(*) from public.wc_title_defenses d
        join public.wc_segments s on s.game_id = d.game_id and s.id = d.segment_id
        join public.wc_events e on e.game_id = s.game_id and e.id = s.event_id
        where d.game_id = r.game_id and d.reign_id = r.id and e.status = 'completed'
      ) end,
      -- Historical partners come from this reign, never the current title holders.
      'holders', (
        select coalesce(jsonb_agg(jsonb_build_object('id', w.id, 'name', w.name, 'image_url', w.image_url)
          order by w.name, w.id), '[]'::jsonb)
        from public.wc_reign_holders h
        join public.wc_game_wrestlers w on w.game_id = h.game_id and w.id = h.wrestler_id
        where h.game_id = r.game_id and h.reign_id = r.id
      )
    ) order by r.won_tick desc, r.id desc
  ), '[]'::jsonb) into v_history
  from public.wc_title_reigns r
  join public.wc_game_titles t on t.game_id = r.game_id and t.id = r.title_id
  where r.game_id = p_game_id and exists (
    select 1 from public.wc_reign_holders own_holder
    where own_holder.game_id = r.game_id and own_holder.reign_id = r.id
      and own_holder.wrestler_id = p_wrestler_id
  );

  -- No GROUP BY title and no history limit: every reign has its own identity,
  -- including repeated reigns, same-week reigns and retired championships.
  return v_profile || jsonb_build_object('championship_history', v_history);
end;
$function$;

revoke all on function public.wc_get_mygm_wrestler_profile_with_reigns(uuid, uuid, integer) from public, anon;
grant execute on function public.wc_get_mygm_wrestler_profile_with_reigns(uuid, uuid, integer) to authenticated;
commit;
