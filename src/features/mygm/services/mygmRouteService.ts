import { supabase } from "../../../lib/supabase";
import type { MyGmRoute } from "../routes/mygmPaths";

export async function resolveMyGmRoute(
  careerRef: string,
  titleRef: string | null,
  signal?: AbortSignal,
): Promise<MyGmRoute | null> {
  const request = supabase.rpc("wc_resolve_mygm_route", {
    p_career_ref: careerRef,
    p_title_ref: titleRef,
  });

  const { data, error } = await (signal ? request.abortSignal(signal) : request)
    .maybeSingle<MyGmRoute>();

  if (error) throw error;
  return data;
}

export async function getMyGmTitleSlugs(
  careerId: string,
  titleIds: readonly string[],
  signal: AbortSignal,
): Promise<ReadonlyMap<string, string>> {
  if (titleIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("wc_game_titles")
    .select("id,slug")
    .eq("game_id", careerId)
    .in("id", [...new Set(titleIds)])
    .abortSignal(signal);

  if (error) throw error;
  return new Map((data ?? []).map(({ id, slug }) => [id, slug]));
}
