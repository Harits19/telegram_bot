import type { FlowConfig } from "./types";

// Default: mock (localStorage). Set VITE_USE_MOCK=false + VITE_API_BASE bila
// backend admin API sudah siap.
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

const STORAGE_KEY = "telegram-bot:flows";

const seed: FlowConfig[] = [
  {
    id: "id-123",
    trigger: ["halo", "hi"],
    steps: [
      {
        id: "greeting",
        response: {
          text: "Selamat Datang di Multi Purpose Bot!",
          reply_markup: {
            inline_keyboard: [
              [{ text: "Menu Utama", callback_data: "ask_wants" }],
            ],
          },
        },
      },
      {
        id: "info_jadwal_sholat",
        http: {
          context: "info_jadwal_sholat_api",
          config: {
            method: "GET",
            url: "https://api.myquran.com/v3/sholat/jadwal/eda80a3d5b344bc40f3bc04f65b7a357/today?tz=Asia%2FJakarta",
          },
        },
        response: {
          $expr:
            "({ text: `Jadwal Sholat Hari Ini \\n${context.info_jadwal_sholat_api.data.data.prov}` })",
          text: "-",
        },
      },
    ],
  },
];

function readMock(): FlowConfig[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return structuredClone(seed);
  }
  return JSON.parse(raw) as FlowConfig[];
}

function writeMock(flows: FlowConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));
}

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

const delay = () => new Promise((resolve) => setTimeout(resolve, 120));

export const api = {
  mock: USE_MOCK,

  async listFlows(): Promise<FlowConfig[]> {
    if (!USE_MOCK) return request<FlowConfig[]>("/api/flows");
    await delay();
    return readMock();
  },

  async saveFlow(flow: FlowConfig): Promise<FlowConfig> {
    if (!USE_MOCK) {
      return request<FlowConfig>(`/api/flows/${encodeURIComponent(flow.id)}`, {
        method: "PUT",
        body: JSON.stringify(flow),
      });
    }
    await delay();
    const flows = readMock();
    const index = flows.findIndex((item) => item.id === flow.id);
    if (index === -1) flows.push(flow);
    else flows[index] = flow;
    writeMock(flows);
    return flow;
  },

  async deleteFlow(id: string): Promise<void> {
    if (!USE_MOCK) {
      await request<unknown>(`/api/flows/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return;
    }
    await delay();
    writeMock(readMock().filter((item) => item.id !== id));
  },
};
