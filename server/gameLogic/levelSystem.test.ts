import { test } from "node:test";
import assert from "node:assert/strict";
import { getXPForNextLevel, getLevelFromXP } from "./levelSystem";

// XP curve: round(100 × L^1.4)
// These are the AUTHORITATIVE values from the formula — the spec's guide
// values (~574 at L5, ~1389 at L10) were approximations from an earlier draft.
test("getXPForNextLevel — formula round(100 × L^1.4) anchor values", () => {
  assert.equal(getXPForNextLevel(1),  100,  "Lv1→2");
  assert.equal(getXPForNextLevel(2),  264,  "Lv2→3");
  assert.equal(getXPForNextLevel(3),  466,  "Lv3→4");
  assert.equal(getXPForNextLevel(4),  696,  "Lv4→5");
  assert.equal(getXPForNextLevel(5),  952,  "Lv5→6");
  assert.equal(getXPForNextLevel(10), 2512, "Lv10→11");
});

test("getXPForNextLevel — strictly increases with level", () => {
  for (let L = 1; L < 20; L++) {
    assert.ok(
      getXPForNextLevel(L + 1) > getXPForNextLevel(L),
      `L${L+1} should require more XP than L${L}`,
    );
  }
});

test("getLevelFromXP — round-trips correctly for level boundaries", () => {
  // 0 XP → level 1, 0 progress
  const zero = getLevelFromXP(0);
  assert.equal(zero.level, 1);
  assert.equal(zero.remainingXP, 0);
  assert.equal(zero.xpForNext, getXPForNextLevel(1));

  // Exactly at level 2 boundary: 100 XP
  const atL2 = getLevelFromXP(100);
  assert.equal(atL2.level, 2);
  assert.equal(atL2.remainingXP, 0);

  // One XP short of level 2
  const shortL2 = getLevelFromXP(99);
  assert.equal(shortL2.level, 1);
  assert.equal(shortL2.remainingXP, 99);
});

test("getLevelFromXP — xpForNext matches getXPForNextLevel at that level", () => {
  for (const totalXP of [0, 50, 100, 300, 500, 1000, 2000]) {
    const info = getLevelFromXP(totalXP);
    assert.equal(
      info.xpForNext,
      getXPForNextLevel(info.level),
      `xpForNext should equal getXPForNextLevel(${info.level}) at totalXP=${totalXP}`,
    );
  }
});
