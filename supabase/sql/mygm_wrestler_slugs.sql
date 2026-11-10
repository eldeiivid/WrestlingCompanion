-- Apply after mygm_slugs.sql.
begin;

alter table public.wc_game_wrestlers add column slug text;
create unique index wc_game_wrestlers_game_slug_uidx
  on public.wc_game_wrestlers (game_id, slug);

create or replace function public.wc_assign_mygm_slug() returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_is_career boolean := tg_relid = 'public.wc_games'::regclass;
  v_is_wrestler boolean := tg_relid = 'public.wc_game_wrestlers'::regclass;
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
  elsif v_is_wrestler then
    v_fallback := 'wrestler';
    -- Roster creation can insert many rows. Use one lock per career.
    perform pg_advisory_xact_lock(hashtextextended('mygm-roster:' || new.game_id::text, 0));
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
    if not v_is_wrestler then
      perform pg_advisory_xact_lock(hashtextextended(v_scope || v_slug, 0));
    end if;
    if v_is_career then
      exit when not exists (select 1 from public.wc_games where slug = v_slug);
    elsif v_is_wrestler then
      exit when not exists (
        select 1 from public.wc_game_wrestlers where game_id = new.game_id and slug = v_slug
      );
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

create trigger wc_game_wrestlers_assign_mygm_slug
before insert or update of slug on public.wc_game_wrestlers
for each row execute function public.wc_assign_mygm_slug();

do $backfill$
declare
  v_row record;
begin
  for v_row in select game_id, id from public.wc_game_wrestlers order by game_id, id loop
    update public.wc_game_wrestlers set slug = null
    where game_id = v_row.game_id and id = v_row.id;
  end loop;
end;
$backfill$;

alter table public.wc_game_wrestlers alter column slug set not null;

create function public.wc_resolve_mygm_wrestler_route(p_career_ref text, p_wrestler_ref text)
returns table (career_id uuid, career_slug text, wrestler_id uuid, wrestler_slug text)
language sql
stable
security invoker
set search_path = ''
as $function$
  with ref as (
    select case
      when p_wrestler_ref ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then p_wrestler_ref::uuid
    end as wrestler_id
  )
  select c.career_id, c.career_slug, w.id, w.slug
  from public.wc_resolve_mygm_route(p_career_ref) c
  cross join ref r
  join public.wc_game_wrestlers w on w.game_id = c.career_id
    and (w.id = r.wrestler_id or (r.wrestler_id is null and w.slug = p_wrestler_ref));
$function$;

revoke all on function public.wc_resolve_mygm_wrestler_route(text, text) from public, anon;
grant execute on function public.wc_resolve_mygm_wrestler_route(text, text) to authenticated;

notify pgrst, 'reload schema';
commit;
