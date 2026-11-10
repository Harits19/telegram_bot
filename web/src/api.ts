import type { FlowConfig } from "./types";

// Same origin in dev (Vite proxies /api) and in production (Express serves web/dist).
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof body.error === "string" ? body.error : response.statusText;
    throw new Error(message || `HTTP ${response.status}`);
  }

  return body as T;
}

// The backend owns the id: Mongo generates it on create, so an empty id means
// "not saved yet" and only the payload is sent.
export const api = {
  async listFlows(): Promise<FlowConfig[]> {
    return request<FlowConfig[]>("/api/flows");
  },

  async saveFlow(flow: FlowConfig): Promise<FlowConfig> {
    const payload = JSON.stringify({ trigger: flow.trigger, steps: flow.steps });

    if (flow.id === "") {
      return request<FlowConfig>("/api/flows", { method: "POST", body: payload });
    }

    return request<FlowConfig>(`/api/flows/${encodeURIComponent(flow.id)}`, {
      method: "PUT",
      body: payload,
    });
  },

  async deleteFlow(id: string): Promise<void> {
    await request<null>(`/api/flows/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};
