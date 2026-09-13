import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { Monitor } from "../src/monitor.js";

describe("mapcidade-uptime-monitor app", () => {
  it("GET / renders the dashboard with all 3 services", async () => {
    const monitor = new Monitor(undefined, vi.fn());
    const app = createApp(monitor);
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Rivermeadow Portal");
    expect(res.text).toContain("Lakeside Gateway");
    expect(res.text).toContain("Oakwood API");
  });

  it("POST /services/:id/report with ok=false 3 times crosses the service down and logs an incident", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const monitor = new Monitor(undefined, fetchImpl);
    const app = createApp(monitor);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    for (let i = 0; i < 3; i++) {
      await request(app)
        .post("/services/lakeside-gateway/report")
        .set("Accept", "application/json")
        .send({ ok: "false", reason: "connection refused" });
    }

    const incidents = await request(app).get("/incidents");
    expect(incidents.body).toHaveLength(1);
    expect(incidents.body[0].serviceName).toBe("Lakeside Gateway");
    logSpy.mockRestore();
  });

  it("POST /services/:id/report for an unknown service returns 404", async () => {
    const monitor = new Monitor(undefined, vi.fn());
    const app = createApp(monitor);
    const res = await request(app).post("/services/nope/report").set("Accept", "application/json").send({ ok: "true" });
    expect(res.status).toBe(404);
  });
});
