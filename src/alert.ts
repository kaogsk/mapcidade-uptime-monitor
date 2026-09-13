import type { IncidentReport } from "./evidence.js";

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; status: number }>;

export interface AlertResult {
  sent: boolean; // true = posted to a real webhook, false = dry-run (logged only)
  webhookStatus?: number;
}

/**
 * Posts the incident to a webhook (Teams/Slack/etc. all accept a JSON POST). With no
 * webhook URL configured, logs the alert instead of throwing — a demo (or a service
 * with no webhook configured yet) shouldn't crash the monitor loop.
 */
export async function sendAlert(
  report: IncidentReport,
  webhookUrl: string | undefined,
  fetchImpl: FetchLike,
): Promise<AlertResult> {
  const message =
    `🔴 INCIDENT: ${report.serviceName} is DOWN\n` +
    `Reason: ${report.reason}\n` +
    `Likely cause: ${report.rootCauseGuess}\n` +
    `Evidence:\n${report.evidence.map((l) => `  ${l}`).join("\n")}`;

  if (!webhookUrl) {
    console.log(`[DRY-RUN webhook — no URL configured]\n${message}`);
    return { sent: false };
  }

  const res = await fetchImpl(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: message }),
  });
  return { sent: true, webhookStatus: res.status };
}
