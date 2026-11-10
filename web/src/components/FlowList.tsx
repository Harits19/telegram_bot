import { useState } from "react";
import type { FlowConfig } from "../types";

export function FlowList({
  flows,
  selectedId,
  onCreate,
  onSelect,
}: {
  flows: FlowConfig[];
  selectedId: string | null;
  onCreate: () => void;
  onSelect: (flow: FlowConfig) => void;
}) {
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? flows.filter(
        (flow) =>
          flow.id.toLowerCase().includes(needle) ||
          flow.trigger.some((trigger) => trigger.toLowerCase().includes(needle)),
      )
    : flows;

  return (
    <div className="flow-list">
      <button className="btn primary block" onClick={onCreate}>
        + Flow baru
      </button>

      <input
        className="input"
        placeholder="Cari id / trigger…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {filtered.length === 0 ? (
        <p className="muted pad">{flows.length === 0 ? "Belum ada flow." : "Tidak ada yang cocok."}</p>
      ) : (
        <ul>
          {filtered.map((flow) => (
            <li key={flow.id}>
              <button
                className={`flow-item${flow.id === selectedId ? " active" : ""}`}
                onClick={() => onSelect(flow)}
              >
                <span className="flow-id">
                  {flow.trigger.join(", ") || "(tanpa trigger)"}
                </span>
                <span className="flow-meta">
                  {flow.steps.length} step · {flow.id.slice(-6)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
