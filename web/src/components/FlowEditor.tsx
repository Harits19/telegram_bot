import { useState } from "react";
import type { FlowConfig, FlowConfigStep } from "../types";
import { emptyStep } from "../flow-utils";
import { StepEditor } from "./StepEditor";

export function FlowEditor({
  flow,
  isNew,
  errors,
  saving,
  actionError,
  savedAt,
  dirty,
  onChange,
  onSave,
  onDelete,
  onCancel,
}: {
  flow: FlowConfig;
  isNew: boolean;
  errors: string[];
  saving: boolean;
  actionError: string | null;
  savedAt: string | null;
  dirty: boolean;
  onChange: (flow: FlowConfig) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [newTrigger, setNewTrigger] = useState("");

  function patch(change: Partial<FlowConfig>) {
    onChange({ ...flow, ...change });
  }

  function patchStep(index: number, step: FlowConfigStep) {
    patch({
      steps: flow.steps.map((item, i) => (i === index ? step : item)),
    });
  }

  function addTrigger() {
    const value = newTrigger.trim().toLowerCase();
    if (value === "" || flow.trigger.includes(value)) return;
    patch({ trigger: [...flow.trigger, value] });
    setNewTrigger("");
  }

  function removeTrigger(value: string) {
    patch({ trigger: flow.trigger.filter((item) => item !== value) });
  }

  function addStep() {
    patch({ steps: [...flow.steps, emptyStep(flow.steps.length)] });
  }

  function removeStep(index: number) {
    if (flow.steps.length === 1) return;
    patch({ steps: flow.steps.filter((_, i) => i !== index) });
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= flow.steps.length) return;
    const steps = [...flow.steps];
    [steps[index], steps[target]] = [steps[target], steps[index]];
    patch({ steps });
  }

  return (
    <div className="editor">
      <header className="editor-head">
        <div>
          <h1>{isNew ? "Flow baru" : flow.id || "(tanpa id)"}</h1>
          <p className="muted small">
            {dirty ? "Belum disimpan" : savedAt ? `Tersimpan ${savedAt}` : "Tersimpan"}
            {errors.length > 0 ? ` · ${errors.length} masalah` : ""}
          </p>
        </div>

        <div className="actions">
          <button className="btn ghost" onClick={onCancel} disabled={saving}>
            Tutup
          </button>
          {!isNew && (
            <button className="btn danger" onClick={onDelete} disabled={saving}>
              Hapus
            </button>
          )}
          <button
            className="btn primary"
            onClick={onSave}
            disabled={saving || errors.length > 0 || !dirty}
          >
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </header>

      {actionError && <div className="banner error">{actionError}</div>}

      {errors.length > 0 && (
        <div className="banner warn">
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="card">
        <div className="row">
          <label className="field grow">
            <span>ID flow</span>
            <input
              className="input mono"
              value={flow.id}
              placeholder="id-123"
              disabled={!isNew}
              onChange={(event) => patch({ id: event.target.value.trim() })}
            />
            <small className="muted">
              Dipakai session sebagai `flowId`. Tidak bisa diubah setelah dibuat.
            </small>
          </label>
        </div>

        <div className="field">
          <span>Trigger</span>
          <div className="chips">
            {flow.trigger.map((trigger) => (
              <span className="chip" key={trigger}>
                {trigger}
                <button
                  className="chip-x"
                  title="Hapus trigger"
                  onClick={() => removeTrigger(trigger)}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              className="chip-input"
              value={newTrigger}
              placeholder="tambah trigger…"
              onChange={(event) => setNewTrigger(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  addTrigger();
                }
              }}
              onBlur={addTrigger}
            />
          </div>
          <small className="muted">
            Pesan masuk dicocokkan case-insensitive ke daftar ini untuk memulai flow.
          </small>
        </div>
      </section>

      <div className="steps-head">
        <h2>Step ({flow.steps.length})</h2>
        <button className="btn" onClick={addStep}>
          + Step
        </button>
      </div>

      {flow.steps.map((step, index) => (
        <StepEditor
          key={index}
          step={step}
          index={index}
          total={flow.steps.length}
          onChange={(next) => patchStep(index, next)}
          onRemove={() => removeStep(index)}
          onMove={(direction) => moveStep(index, direction)}
        />
      ))}
    </div>
  );
}
