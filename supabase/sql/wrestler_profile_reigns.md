# Wrestler career reigns

Run `wrestler_profile_reigns.sql` in the Supabase SQL Editor before using the updated wrestler profile. It creates the read-only `wc_get_mygm_wrestler_profile_with_reigns` RPC and leaves the existing profile RPC intact. No tables or stored reigns are changed.

The new RPC keeps the original response fields and adds `championship_history`, an array with one row per reign ID. Each row includes the title ID/name/image/category/division, reign ID, won/lost ticks, current/completed status, elapsed weeks, successful completed-show defenses and the holders attached to that specific reign. The profiled wrestler can be excluded from holders in the UI to display only their tag partners. Same-title and same-week reigns are kept separately. Titles that have been retired remain in history.

Elapsed weeks follow the existing championship screens: `(lost_tick ?? current_tick) - won_tick`, with a minimum of zero. Ticks use the existing 50-week season calendar; a current reign has no end tick. MITB is identified by `category = 'mitb'`, returned as briefcase possession with zero defenses, and displayed separately from championship reigns.

`p_history_limit` still applies only to recent matches; it never truncates title reigns. Reigns are ordered by won tick descending and then reign ID for deterministic ordering within the same week. All joins are scoped by game ID. Caller authentication, career ownership, wrestler membership in the career and existing RLS remain enforced with SECURITY INVOKER.

The roster profile calls the new RPC and validates its full history. The market/catalog profile keeps its existing contract. A missing installation fails the roster profile request rather than silently displaying an incomplete history.

Local validation: `node --test tests/wrestlerReignsValidation.test.mjs`.
Database integration checks: run `verify_wrestler_profile_reigns.sql` after installation; it creates an isolated test career and rolls it back. This SQL has not been executed against the live project because this chat has no active database connector.
