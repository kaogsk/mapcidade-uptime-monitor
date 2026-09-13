import { describe, it, expect } from "vitest";
import { guessRootCause, buildIncidentReport } from "../src/evidence.js";

describe("guessRootCause", () => {
  it("matches known failure patterns", () => {
    expect(guessRootCause("connection timed out")).toMatch(/timeout/i);
    expect(guessRootCause("ECONNREFUSED")).toMatch(/not listening/i);
    expect(guessRootCause("process killed: out of memory")).toMatch(/memory/i);
    expect(guessRootCause("no space left on device")).toMatch(/disk/i);
  });

  it("falls back to a generic message for an unrecognized reason", () => {
    expect(guessRootCause("something weird happened")).toMatch(/manual investigation/i);
  });
});

describe("buildIncidentReport", () => {
  it("includes service name, reason, evidence lines, and a root cause guess", () => {
    const report = buildIncidentReport("Rivermeadow Portal", "connection refused", "2026-09-13T00:00:00.000Z");
    expect(report.serviceName).toBe("Rivermeadow Portal");
    expect(report.reason).toBe("connection refused");
    expect(report.evidence.length).toBeGreaterThan(0);
    expect(report.evidence.every((l) => l.includes("Rivermeadow Portal"))).toBe(true);
    expect(report.rootCauseGuess).toMatch(/not listening/i);
  });
});
