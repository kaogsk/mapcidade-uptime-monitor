import { createApp } from "../src/app.js";
import { Monitor } from "../src/monitor.js";

/**
 * Known demo limitation of serverless deployment: this Monitor instance lives in
 * module scope, so it persists across requests only within one warm lambda instance
 * and only until Vercel recycles it (state is not shared across concurrent instances
 * or across cold starts). Fine for a portfolio demo of the edge-triggered alerting
 * logic; a real deployment of this architecture would move state to a shared store
 * (Redis, a database) instead of process memory. Disclosed in the README.
 */
const monitor = new Monitor(process.env.ALERT_WEBHOOK_URL, fetch as never);

export default createApp(monitor);
