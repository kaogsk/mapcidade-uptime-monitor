import { applyResult, initialState, type ServiceState } from "./state.js";
import { buildIncidentReport, type IncidentReport } from "./evidence.js";
import { sendAlert, type FetchLike, type AlertResult } from "./alert.js";

export interface Service {
  id: string;
  name: string;
}

export const SERVICES: Service[] = [
  { id: "rivermeadow-portal", name: "Rivermeadow Portal" },
  { id: "lakeside-gateway", name: "Lakeside Gateway" },
  { id: "oakwood-api", name: "Oakwood API" },
];

export interface ReportOutcome {
  service: Service;
  state: ServiceState;
  incident: IncidentReport | null;
  alert: AlertResult | null;
}

/** Owns in-memory state for all monitored services and the incident log. Not persisted — a restart starts every service fresh at "up", which is the right default for a demo. */
export class Monitor {
  private readonly states = new Map<string, ServiceState>();
  private readonly incidents: IncidentReport[] = [];

  constructor(
    private readonly webhookUrl: string | undefined,
    private readonly fetchImpl: FetchLike,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {
    for (const s of SERVICES) this.states.set(s.id, initialState());
  }

  getState(serviceId: string): ServiceState | undefined {
    return this.states.get(serviceId);
  }

  listStates(): { service: Service; state: ServiceState }[] {
    return SERVICES.map((service) => ({ service, state: this.states.get(service.id)! }));
  }

  listIncidents(): IncidentReport[] {
    return this.incidents;
  }

  /** Records one health-check result for a service and fires an alert if it just crossed into "down". */
  async reportResult(serviceId: string, ok: boolean, reason: string): Promise<ReportOutcome> {
    const service = SERVICES.find((s) => s.id === serviceId);
    if (!service) throw new Error(`unknown service: ${serviceId}`);

    const current = this.states.get(serviceId) ?? initialState();
    const { state, crossedDown } = applyResult(current, ok, 3, 2, this.now);
    this.states.set(serviceId, state);

    if (!crossedDown) return { service, state, incident: null, alert: null };

    const incident = buildIncidentReport(service.name, reason, this.now());
    this.incidents.unshift(incident);
    const alert = await sendAlert(incident, this.webhookUrl, this.fetchImpl);
    return { service, state, incident, alert };
  }
}
