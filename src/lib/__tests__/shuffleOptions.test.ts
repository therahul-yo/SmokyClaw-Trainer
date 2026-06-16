import { describe, expect, it } from "vitest";
import { shuffleOptions } from "../shuffleOptions";

describe("shuffleOptions", () => {
  const opts = ["alpha", "beta", "gamma", "delta"];

  it("is a permutation that preserves the set of options", () => {
    const s = shuffleOptions("q-1", opts, 0);
    expect([...s.options].sort()).toEqual([...opts].sort());
    expect(s.options).toHaveLength(opts.length);
  });

  it("remaps answerIndex to the correct option's new position", () => {
    const s = shuffleOptions("q-1", opts, 2); // correct = "gamma"
    expect(s.options[s.answerIndex]).toBe("gamma");
  });

  it("is deterministic per id (stable across calls — no jumping)", () => {
    expect(shuffleOptions("q-1", opts, 1)).toEqual(shuffleOptions("q-1", opts, 1));
  });

  it("differs across ids (breaks fixed-position bias)", () => {
    const orders = new Set(
      ["q-1", "q-2", "q-3", "q-4", "q-5", "q-6"].map((id) =>
        shuffleOptions(id, opts, 0).order.join(","),
      ),
    );
    // not all identical — the answer doesn't land in the same slot every item
    expect(orders.size).toBeGreaterThan(1);
  });

  it("order maps display position back to the original index", () => {
    const s = shuffleOptions("q-7", opts, 0);
    s.options.forEach((opt, displayIdx) => {
      expect(opt).toBe(opts[s.order[displayIdx]]);
    });
  });
});
