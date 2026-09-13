/** Fake evidence collection — a real monitor would pull application/db/OS logs; here it's deterministic canned lines per failure reason, keyed by service name and a caller-supplied reason. */
export function collectEvidence(serviceName: string, reason: string, timestamp: string): string[] {
  return [
    `[${timestamp}] ${serviceName}: health check failed`,
    `[${timestamp}] ${serviceName}: reason="${reason}"`,
    `[${timestamp}] ${serviceName}: 3 consecutive failed checks, marking service DOWN`,
  ];
}

const ROOT_CAUSE_RULES: { pattern: RegExp; cause: string }[] = [
  { pattern: /timeout|timed out/i, cause: "likely network timeout or an overloaded downstream dependency" },
  { pattern: /connection refused|econnrefused/i, cause: "the service process is likely not listening (crashed or not started)" },
  { pattern: /out of memory|oom/i, cause: "likely memory exhaustion" },
  { pattern: /disk|no space/i, cause: "likely disk space exhaustion" },
];

/** A small deterministic heuristic, not a model call — matches the failure reason against known patterns and falls back to a generic message. */
export function guessRootCause(reason: string): string {
  const match = ROOT_CAUSE_RULES.find((r) => r.pattern.test(reason));
  return match ? match.cause : "cause unclear from the failure reason alone — needs manual investigation";
}

export interface IncidentReport {
  serviceName: string;
  reason: string;
  evidence: string[];
  rootCauseGuess: string;
  timestamp: string;
}

export function buildIncidentReport(serviceName: string, reason: string, timestamp: string): IncidentReport {
  return {
    serviceName,
    reason,
    evidence: collectEvidence(serviceName, reason, timestamp),
    rootCauseGuess: guessRootCause(reason),
    timestamp,
  };
}
