import { describe, it, expect, vi } from "vitest";
import { Monitor } from "../src/monitor.js";

const fixedNow = () => "2026-09-13T00:00:00.000Z";

describe("Monitor", () => {
  it("fires exactly one alert when a service crosses into down, none before or after", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const monitor = new Monitor("https://example.test/webhook", fetchImpl, fixedNow);

    const r1 = await monitor.reportResult("rivermeadow-portal", false, "timeout");
    const r2 = await monitor.reportResult("rivermeadow-portal", false, "timeout");
    const r3 = await monitor.reportResult("rivermeadow-portal", false, "timeout");
    const r4 = await monitor.reportResult("rivermeadow-portal", false, "timeout");

    expect(r1.incident).toBeNull();
    expect(r2.incident).toBeNull();
    expect(r3.incident).not.toBeNull();
    expect(r4.incident).toBeNull(); // still down, but no re-alert
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(monitor.listIncidents()).toHaveLength(1);
  });

  it("throws for an unknown service id", async () => {
    const monitor = new Monitor(undefined, vi.fn(), fixedNow);
    await expect(monitor.reportResult("no-such-service", false, "x")).rejects.toThrow(/unknown service/);
  });

  it("listStates reports all 3 fictional services starting up", () => {
    const monitor = new Monitor(undefined, vi.fn(), fixedNow);
    const states = monitor.listStates();
    expect(states).toHaveLength(3);
    expect(states.every((s) => s.state.status === "up")).toBe(true);
  });
});
