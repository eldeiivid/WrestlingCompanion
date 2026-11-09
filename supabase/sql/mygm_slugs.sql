begin;

alter table public.wc_games add column slug text;
alter table public.wc_game_titles add column slug text;

create unique index wc_games_slug_uidx on public.wc_games (slug)
  where slug is not null;
create unique index wc_game_titles_game_slug_uidx on public.wc_game_titles (game_id, slug);

-- The allocator must see collisions even when RLS hides the existing row.
-- It can only run as a trigger. The resolver below still runs as the caller.
create function public.wc_assign_mygm_slug() returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_is_career boolean := tg_relid = 'public.wc_games'::regclass;
  v_scope text := 'mygm-career:';
  v_fallback text := 'career';
  v_base text;
  v_slug text;
  v_suffix bigint := 1;
begin
  if tg_op = 'UPDATE' and old.slug is not null then
    new.slug := old.slug;
    return new;
  end if;

  if v_is_career then
    if new.mode is distinct from 'mygm' then
      new.slug := null;
      return new;
    end if;
  else
    v_scope := 'mygm-title:' || new.game_id::text || ':';
    v_fallback := 'title';
  end if;

  v_base := normalize(coalesce(new.name, ''), NFKD);
  v_base := regexp_replace(v_base, U&'[\0300-\036f''\2019]', '', 'g');
  v_base := lower(v_base collate pg_catalog."C");
  v_base := trim(both '-' from left(regexp_replace(v_base, '[^a-z0-9]+', '-', 'g'), 80));
  v_base := coalesce(nullif(v_base, ''), v_fallback);

  -- Reserve the creation route and keep UUID lookups unambiguous.
  if (v_is_career and v_base = 'new') or
     v_base ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    v_base := v_fallback || '-' || v_base;
  end if;

  v_slug := v_base;
  loop
    -- Serialize attempts for each candidate, including natural names like Belt 2.
    perform pg_advisory_xact_lock(hashtextextended(v_scope || v_slug, 0));
    if v_is_career then
      exit when not exists (select 1 from public.wc_games where slug = v_slug);
    else
      exit when not exists (
        select 1 from public.wc_game_titles where game_id = new.game_id and slug = v_slug
      );
    end if;
    v_suffix := v_suffix + 1;
    v_slug := v_base || '-' || v_suffix::text;
  end loop;

  new.slug := v_slug;
  return new;
end;
$function$;

revoke all on function public.wc_assign_mygm_slug() from public, anon, authenticated;

create trigger wc_games_assign_mygm_slug
before insert or update of slug, mode on public.wc_games
for each row execute function public.wc_assign_mygm_slug();

create trigger wc_game_titles_assign_mygm_slug
before insert or update of slug on public.wc_game_titles
for each row execute function public.wc_assign_mygm_slug();

-- Backfill in a stable order so the first row in each group gets the base slug.
do $backfill$
declare
  v_row record;
begin
  for v_row in select id from public.wc_games where mode = 'mygm' order by created_at, id loop
    update public.wc_games set slug = null where id = v_row.id;
  end loop;
  for v_row in select game_id, id from public.wc_game_titles order by game_id, id loop
    update public.wc_game_titles set slug = null where game_id = v_row.game_id and id = v_row.id;
  end loop;
end;
$backfill$;

alter table public.wc_games add constraint wc_games_mygm_slug_required
  check (mode is distinct from 'mygm' or slug is not null);
alter table public.wc_game_titles alter column slug set not null;

create function public.wc_resolve_mygm_route(p_career_ref text, p_title_ref text default null)
returns table (career_id uuid, career_slug text, title_id uuid, title_slug text)
language sql
stable
security invoker
set search_path = ''
as $function$
  with refs as (
    select
      case when p_career_ref ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then p_career_ref::uuid end as game_id,
      case when p_title_ref ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then p_title_ref::uuid end as title_id
  )
  select g.id, g.slug, t.id, t.slug
  from refs r
  join public.wc_games g
    on g.id = r.game_id or (r.game_id is null and g.slug = p_career_ref)
  left join public.wc_game_titles t
    on t.game_id = g.id
    and (t.id = r.title_id or (r.title_id is null and t.slug = p_title_ref))
  where g.owner_id = auth.uid()
    and g.mode = 'mygm'
    and (p_title_ref is null or t.id is not null);
$function$;

revoke all on function public.wc_resolve_mygm_route(text, text) from public, anon;
grant execute on function public.wc_resolve_mygm_route(text, text) to authenticated;

notify pgrst, 'reload schema';
commit;
