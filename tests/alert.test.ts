import { describe, it, expect, vi } from "vitest";
import { sendAlert } from "../src/alert.js";
import { buildIncidentReport } from "../src/evidence.js";

const report = buildIncidentReport("Rivermeadow Portal", "connection refused", "2026-09-13T00:00:00.000Z");

describe("sendAlert", () => {
  it("dry-runs (logs, does not call fetch) when no webhook URL is configured", async () => {
    const fetchImpl = vi.fn();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await sendAlert(report, undefined, fetchImpl);

    expect(result.sent).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("DRY-RUN webhook"));

    logSpy.mockRestore();
  });

  it("posts a JSON payload to the webhook URL when one is configured", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    const result = await sendAlert(report, "https://example.test/webhook", fetchImpl);

    expect(result.sent).toBe(true);
    expect(result.webhookStatus).toBe(200);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://example.test/webhook",
      expect.objectContaining({ method: "POST", headers: expect.objectContaining({ "content-type": "application/json" }) }),
    );
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.text).toContain("Rivermeadow Portal");
  });
});
