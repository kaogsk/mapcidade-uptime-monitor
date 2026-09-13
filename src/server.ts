import { pathToFileURL } from "node:url";
import { createApp } from "./app.js";
import { Monitor } from "./monitor.js";

function main(): void {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL; // unset by default -> dry-run alerts (logged, not posted)
  const monitor = new Monitor(webhookUrl, fetch as never);
  const app = createApp(monitor);
  const port = Number(process.env.PORT ?? 3001);
  app.listen(port, () => {
    console.log(`mapcidade-uptime-monitor listening on http://localhost:${port}`);
    if (!webhookUrl) console.log("ALERT_WEBHOOK_URL not set — incident alerts will be logged (dry-run), not posted.");
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
