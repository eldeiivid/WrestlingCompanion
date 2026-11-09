# MyGM URL slugs

Run [mygm_slugs.sql](mygm_slugs.sql) once in the Supabase SQL Editor. It backfills existing MyGM careers and game titles in the same transaction that installs slug generation. Career slugs are unique across MyGM. Title slugs are unique within their career. Collisions append `-2`, `-3`, and so on. Renaming keeps the stored slug. `/mygm/new` remains reserved.

Use the authenticated Supabase REST API for links:

| Purpose | Request | Fields |
| --- | --- | --- |
| List careers | `GET /rest/v1/wc_games?mode=eq.mygm&owner_id=eq.<user-uuid>&select=id,name,slug` | `id`, `name`, `slug` |
| List title slugs for a career | `GET /rest/v1/wc_game_titles?game_id=eq.<career-uuid>&select=id,name,slug` | `id`, `name`, `slug` |
| Resolve a career or nested title | `POST /rest/v1/rpc/wc_resolve_mygm_route` | `career_id`, `career_slug`, `title_id`, `title_slug` |

Add `slug` to the existing career list projection. For an existing paginated title list, restrict the title query to the UUIDs on the page and join by `id`. These table reads use the existing grants and RLS.

Pass the route segments as `p_career_ref` and, for a title route, `p_title_ref`. Both accept either a stored slug or a canonical UUID, including mixed slug/UUID pairs. A successful lookup returns one row. The title fields are null for a career-only request. Missing or inaccessible careers and titles return zero rows. With supabase-js:

```ts
const { data, error } = await supabase
  .rpc("wc_resolve_mygm_route", {
    p_career_ref: careerSegment,
    p_title_ref: titleSegment ?? null,
  })
  .maybeSingle();
```

Build `/mygm/${career_slug}` or `/mygm/${career_slug}/titles/${title_slug}` from the result. Use the same canonical path to redirect old UUID URLs, preserving any query string and hash. Pass `career_id` and `title_id` to existing MyGM detail and mutation RPCs.

Run [verify_mygm_slugs.sql](verify_mygm_slugs.sql) after installation to check collisions, renames, UUID resolution, title scoping, and ownership. It rolls back its fixtures.

# Manual rivalry editing

## Finishing and deleting

After the creation script has been installed, run `manage_mygm_rivalry.sql` once. Do not rerun `save_mygm_rivalry.sql` (it creates a table that already exists).

`wc_manage_mygm_rivalry` accepts `p_game_id`, `p_feud_id`, `p_action` (`resolve` or `delete`) and optional `p_winning_side` (1, 2 or null). Finishing uses the server's current tick, preserves members/history, and adds one resolution entry. An identical retry does not add another. Only active rivalries can be finished. Deletion clears segment links, deletes rivalry history and members, then deletes the rivalry; its creation/edit request rows cascade. Events and segment results remain, including their original submitted result snapshots.

The function runs as the caller and checks career ownership. Existing owner policies/grants must additionally allow DELETE on `wc_feud_log`, `wc_feud_members` and `wc_feuds`, and UPDATE of `wc_segments.feud_id` (including completed segments). Missing permissions must be fixed in the existing owner policies; do not switch the function to SECURITY DEFINER to bypass them. No RLS changes are included here because the supplied exports do not contain the project's policies.

Verify finish with each side and without a winner, repeated finish, finish on a resolved/inactive rivalry, and deletion with linked historical shows. Check that another user's career is inaccessible, a repeated delete is safe, request rows are removed, and show/match/promo results are retained. `verify_manage_mygm_rivalry.sql` provides a rollback-only integration check to run in the SQL Editor after installation. Database execution remains pending; no live database connector is available in this chat.

## Creating and editing

Apply `save_mygm_rivalry.sql` once in the project's SQL Editor. This is a transactional installation script, not an applied migration. It adds `wc_save_mygm_rivalry` and a request table for retry protection. It uses the existing tables and `wc_assert_mygm_season_ready` from the schema supplied in the Supabase chat.

The function runs as the caller, retaining existing RLS and grants. Existing permissions must allow authenticated owners to select/update their career, read their roster and brands, insert/update rivalries, insert/delete rivalry members and insert history. Do not bypass RLS if a permission is missing; inspect the existing owner policies first. The supplied schema export does not contain those policies or grants.

RPC arguments match `saveRivalry` in the client. `p_feud_id = null` creates an active rivalry; otherwise it updates the existing rivalry without changing status or winner. `p_started_tick = null` uses the locked career's current week. One season has 50 weeks. A retry uses the same request UUID and payload, returning the original rivalry UUID without repeating changes.

Verify in a test career after applying:

- Create 1v1 and 2v2 rivalries with levels 1–4; reload and inspect their members and history.
- Leave the start week empty; confirm the saved tick is the server's current tick. Test a past season and week 50.
- Edit level, start and participants; confirm the list and detail refresh and survive a page reload.
- Retry the same request UUID; confirm one rivalry and one history entry. Reuse that UUID with another payload; expect rejection.
- Reject repeated participants, unequal teams, levels outside 1–4, future starts and participants from another career.
- Reject duplicate active rivalries including reversed sides. Verify booking can use a manually created rivalry.
- Reject a start after the rivalry's first recorded show appearance or its end.
- As a different authenticated owner and as an anonymous caller, verify the RPC and request table cannot access the test career.
- Verify career deletion still works with the added request rows.

The database script has not been executed or tested against the live project. Its Supabase connector returned `Unknown tool` during implementation.
