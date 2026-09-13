import express, { type Express } from "express";
import { Monitor } from "./monitor.js";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderDashboard(monitor: Monitor): string {
  const rows = monitor
    .listStates()
    .map(({ service, state }) => {
      const badge = state.status === "up" ? '<span style="color:#0a0">UP</span>' : '<span style="color:#c00">DOWN</span>';
      return `<tr><td>${escapeHtml(service.name)}</td><td>${badge}</td><td>${state.consecutiveFailures}</td><td>${escapeHtml(state.lastCheckedAt ?? "never")}</td>
        <td><form method="post" action="/services/${service.id}/report" style="display:inline"><input type="hidden" name="ok" value="false" /><input type="hidden" name="reason" value="connection refused" /><button>Report failure</button></form>
        <form method="post" action="/services/${service.id}/report" style="display:inline"><input type="hidden" name="ok" value="true" /><button>Report success</button></form></td></tr>`;
    })
    .join("\n");

  const incidents = monitor
    .listIncidents()
    .map((i) => `<li>[${escapeHtml(i.timestamp)}] <b>${escapeHtml(i.serviceName)}</b> — ${escapeHtml(i.reason)} → ${escapeHtml(i.rootCauseGuess)}</li>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><title>mapcidade-uptime-monitor</title>
<style>body{font-family:system-ui,sans-serif;max-width:50rem;margin:2rem auto}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:0.4rem;text-align:left}</style>
</head>
<body>
  <h1>Service status</h1>
  <p>Each "Report failure" click simulates one failed health check. 3 in a row crosses a service into DOWN and fires an incident alert; 2 successes in a row recovers it.</p>
  <table><thead><tr><th>Service</th><th>Status</th><th>Consecutive failures</th><th>Last checked</th><th>Simulate</th></tr></thead><tbody>${rows}</tbody></table>
  <h2>Incident log</h2>
  <ul>${incidents || "<li>No incidents yet.</li>"}</ul>
</body>
</html>
`;
}

export function createApp(monitor: Monitor): Express {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.get("/", (_req, res) => res.type("html").send(renderDashboard(monitor)));

  app.post("/services/:serviceId/report", async (req, res) => {
    const ok = String(req.body.ok) === "true";
    const reason = ok ? "" : String(req.body.reason ?? "unspecified failure");
    try {
      const outcome = await monitor.reportResult(req.params.serviceId, ok, reason);
      if (req.headers.accept?.includes("application/json")) {
        res.json(outcome);
      } else {
        res.redirect("/");
      }
    } catch (e) {
      res.status(404).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.get("/incidents", (_req, res) => res.json(monitor.listIncidents()));

  return app;
}
