import assert from "node:assert/strict";
import test from "node:test";
import { isWrestlerReignHistory } from "../src/features/mygm/services/roster/wrestlerReignsValidation.ts";

const holder = { id: "wrestler", name: "Wrestler", image_url: null };
const base = {
  id: "title", name: "World title", image_url: null, category: "world",
  division: "singles", reign_id: "first-reign", won_tick: 2, lost_tick: 5,
  status: "completed", duration_weeks: 3, defenses: 2, holders: [holder],
};

test("keeps repeated reigns of one title, including same-week changes", () => {
  const history = [base, { ...base, reign_id: "second-reign", won_tick: 5, lost_tick: 5, duration_weeks: 0 },
    { ...base, reign_id: "third-reign", won_tick: 5, lost_tick: null, status: "current", duration_weeks: 5 }];
  assert.equal(isWrestlerReignHistory(history, 10, holder.id), true);
});

test("preserves distinct tag partners in different reigns", () => {
  const history = [
    { ...base, category: "tag_team", division: "tag_team", holders: [holder, { ...holder, id: "partner-a" }] },
    { ...base, reign_id: "second-reign", category: "tag_team", division: "tag_team", holders: [holder, { ...holder, id: "partner-b" }] },
  ];
  assert.equal(isWrestlerReignHistory(history, 10, holder.id), true);
  assert.equal(history[0].holders[1].id, "partner-a");
  assert.equal(history[1].holders[1].id, "partner-b");
});

test("rejects duplicate reign identities without deduplicating titles", () => {
  assert.equal(isWrestlerReignHistory([base, { ...base }], 10, holder.id), false);
});

test("validates completed and current durations against the career clock", () => {
  assert.equal(isWrestlerReignHistory([{ ...base, duration_weeks: 8 }], 10, holder.id), false);
  assert.equal(isWrestlerReignHistory([{ ...base, lost_tick: null, status: "current", duration_weeks: 8 }], 10, holder.id), true);
  assert.equal(isWrestlerReignHistory([{ ...base, lost_tick: 11, duration_weeks: 9 }], 10, holder.id), false);
});

test("rejects inconsistent status and dates", () => {
  assert.equal(isWrestlerReignHistory([{ ...base, status: "current" }], 10, holder.id), false);
  assert.equal(isWrestlerReignHistory([{ ...base, lost_tick: 1 }], 10, holder.id), false);
});

test("distinguishes MITB possession from championship defenses", () => {
  assert.equal(isWrestlerReignHistory([{ ...base, category: "mitb", defenses: 0 }], 10, holder.id), true);
  assert.equal(isWrestlerReignHistory([{ ...base, category: "mitb", defenses: 1 }], 10, holder.id), false);
});

test("requires the profiled wrestler and unique holders for every reign", () => {
  assert.equal(isWrestlerReignHistory([{ ...base, holders: [{ ...holder, id: "someone-else" }] }], 10, holder.id), false);
  assert.equal(isWrestlerReignHistory([{ ...base, holders: [holder, holder] }], 10, holder.id), false);
});

test("allows empty history, rejects missing or malformed history", () => {
  assert.equal(isWrestlerReignHistory([], 10, holder.id), true);
  assert.equal(isWrestlerReignHistory(undefined, 10, holder.id), false);
  assert.equal(isWrestlerReignHistory([null], 10, holder.id), false);
});
