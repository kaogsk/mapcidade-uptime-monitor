import { describe, it, expect } from "vitest";
import { applyResult, initialState } from "../src/state.js";

const fixedNow = () => "2026-09-13T00:00:00.000Z";

describe("applyResult", () => {
  it("does not cross down before the failure threshold", () => {
    let state = initialState();
    for (let i = 0; i < 2; i++) {
      const result = applyResult(state, false, 3, 2, fixedNow);
      expect(result.crossedDown).toBe(false);
      state = result.state;
    }
    expect(state.status).toBe("up");
    expect(state.consecutiveFailures).toBe(2);
  });

  it("crosses down exactly on the 3rd consecutive failure, not before or after", () => {
    let state = initialState();
    let lastResult = applyResult(state, false, 3, 2, fixedNow);
    state = lastResult.state;
    lastResult = applyResult(state, false, 3, 2, fixedNow);
    state = lastResult.state;
    expect(lastResult.crossedDown).toBe(false);

    lastResult = applyResult(state, false, 3, 2, fixedNow);
    expect(lastResult.crossedDown).toBe(true);
    expect(lastResult.state.status).toBe("down");

    // a 4th consecutive failure must NOT re-fire crossedDown (edge-triggered, not level-triggered)
    const fourth = applyResult(lastResult.state, false, 3, 2, fixedNow);
    expect(fourth.crossedDown).toBe(false);
    expect(fourth.state.status).toBe("down");
  });

  it("recovers to up after the recovery threshold of consecutive successes", () => {
    let state: ReturnType<typeof initialState> = { status: "down", consecutiveFailures: 5, consecutiveSuccesses: 0, lastCheckedAt: null };
    let result = applyResult(state, true, 3, 2, fixedNow);
    expect(result.crossedUp).toBe(false);
    state = result.state;

    result = applyResult(state, true, 3, 2, fixedNow);
    expect(result.crossedUp).toBe(true);
    expect(result.state.status).toBe("up");
  });

  it("a single success while up does not reset status or fire crossedUp", () => {
    const result = applyResult(initialState(), true, 3, 2, fixedNow);
    expect(result.crossedUp).toBe(false);
    expect(result.state.status).toBe("up");
  });
});
