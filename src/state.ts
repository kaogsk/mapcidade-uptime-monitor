export type ServiceStatus = "up" | "down";

export interface ServiceState {
  status: ServiceStatus;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastCheckedAt: string | null;
}

export function initialState(): ServiceState {
  return { status: "up", consecutiveFailures: 0, consecutiveSuccesses: 0, lastCheckedAt: null };
}

export interface ApplyResult {
  state: ServiceState;
  crossedDown: boolean;
  crossedUp: boolean;
}

/**
 * Edge-triggered health tracking: an alert should fire once when a service crosses
 * INTO "down" after `downThreshold` consecutive failures, not on every failed check
 * after that — otherwise a 2-hour outage pages the on-call team every 30 seconds.
 * Recovery is symmetric with its own threshold to avoid flapping on a single good check.
 */
export function applyResult(
  state: ServiceState,
  ok: boolean,
  downThreshold = 3,
  upThreshold = 2,
  now: () => string = () => new Date().toISOString(),
): ApplyResult {
  const next: ServiceState = {
    status: state.status,
    consecutiveFailures: ok ? 0 : state.consecutiveFailures + 1,
    consecutiveSuccesses: ok ? state.consecutiveSuccesses + 1 : 0,
    lastCheckedAt: now(),
  };

  let crossedDown = false;
  let crossedUp = false;

  if (state.status === "up" && !ok && next.consecutiveFailures >= downThreshold) {
    next.status = "down";
    crossedDown = true;
  } else if (state.status === "down" && ok && next.consecutiveSuccesses >= upThreshold) {
    next.status = "up";
    crossedUp = true;
  }

  return { state: next, crossedDown, crossedUp };
}
