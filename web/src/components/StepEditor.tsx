import { useState } from "react";
import type { Button, FlowConfigStep, HttpConfig } from "../types";
import { parseJsonObject } from "../flow-utils";
import { Preview } from "./Preview";

type KeyboardMode = "none" | "inline" | "reply";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function StepEditor({
  step,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  step: FlowConfigStep;
  index: number;
  total: number;
  onChange: (step: FlowConfigStep) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const [open, setOpen] = useState(true);
  const [httpOpen, setHttpOpen] = useState(!!step.http);
  const [bodyText, setBodyText] = useState(() =>
    step.http?.config.data === undefined
      ? ""
      : JSON.stringify(step.http.config.data, null, 2),
  );
  const [bodyError, setBodyError] = useState<string | null>(null);

  const response = step.response;
  const useExpr = response.$expr !== undefined;
  const keyboardMode: KeyboardMode = response.reply_markup?.inline_keyboard
    ? "inline"
    : response.reply_markup?.keyboard
      ? "reply"
      : "none";

  function patch(change: Partial<FlowConfigStep>) {
    onChange({ ...step, ...change });
  }

  function patchResponse(change: Partial<FlowConfigStep["response"]>) {
    const next = { ...response, ...change };
    for (const key of Object.keys(next) as (keyof typeof next)[]) {
      if (next[key] === undefined) delete next[key];
    }
    patch({ response: next });
  }

  function setExprMode(enabled: boolean) {
    patchResponse({ $expr: enabled ? "" : undefined });
  }

  function setKeyboardMode(mode: KeyboardMode) {
    if (mode === "none") patchResponse({ reply_markup: undefined });
    else if (mode === "inline")
      patchResponse({
        reply_markup: {
          inline_keyboard: [[{ text: "Tombol", callback_data: step.id }]],
        },
      });
    else
      patchResponse({
        reply_markup: { keyboard: [[{ text: "Tombol" }]] },
      });
  }

  function rows(): Button[][] {
    return response.reply_markup?.inline_keyboard ?? response.reply_markup?.keyboard ?? [];
  }

  function setRows(next: Button[][]) {
    if (keyboardMode === "inline")
      patchResponse({ reply_markup: { inline_keyboard: next } });
    else if (keyboardMode === "reply")
      patchResponse({ reply_markup: { keyboard: next } });
  }

  function patchButton(rowIndex: number, buttonIndex: number, change: Partial<Button>) {
    setRows(
      rows().map((row, r) =>
        r !== rowIndex
          ? row
          : row.map((button, b) => (b !== buttonIndex ? button : { ...button, ...change })),
      ),
    );
  }

  function removeButton(rowIndex: number, buttonIndex: number) {
    setRows(
      rows()
        .map((row, r) => (r !== rowIndex ? row : row.filter((_, b) => b !== buttonIndex)))
        .filter((row) => row.length > 0),
    );
  }

  function addButton(rowIndex: number) {
    setRows(
      rows().map((row, r) =>
        r !== rowIndex
          ? row
          : [
              ...row,
              keyboardMode === "inline"
                ? { text: "Tombol", callback_data: "" }
                : { text: "Tombol" },
            ],
      ),
    );
  }

  function addRow() {
    setRows([...rows(), [{ text: "Tombol", callback_data: "" }]]);
  }

  function toggleHttp(enabled: boolean) {
    setHttpOpen(enabled);
    if (!enabled) {
      patch({ http: undefined });
      return;
    }
    patch({ http: { context: "", config: { method: "GET", url: "" } } });
  }

  function patchHttp(change: Partial<{ context?: string; config: HttpConfig }>) {
    patch({
      http: {
        context: change.context ?? step.http?.context,
        config: change.config ?? step.http?.config ?? {},
      },
    });
  }

  function changeBody(text: string) {
    setBodyText(text);
    const parsed = parseJsonObject(text);
    if (parsed.error) {
      setBodyError(parsed.error);
      return;
    }
    setBodyError(null);
    patchHttp({ config: { ...(step.http?.config ?? {}), data: parsed.value } });
  }

  return (
    <section className={`card step${open ? " open" : ""}`}>
      <header className="step-head">
        <button className="chevron" onClick={() => setOpen(!open)} title="Buka/tutup">
          {open ? "▾" : "▸"}
        </button>
        <span className="step-index">{index + 1}</span>
        <input
          className="input mono step-id"
          value={step.id}
          placeholder="id-step"
          onChange={(event) => patch({ id: event.target.value.trim() })}
        />
        {index === 0 && <span className="tag">step awal</span>}
        <div className="step-actions">
          <button className="icon-btn" onClick={() => onMove(-1)} disabled={index === 0} title="Naik">
            ↑
          </button>
          <button
            className="icon-btn"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            title="Turun"
          >
            ↓
          </button>
          <button
            className="icon-btn danger"
            onClick={onRemove}
            disabled={total === 1}
            title="Hapus step"
          >
            ×
          </button>
        </div>
      </header>

      {open && (
        <div className="step-body">
          <div className="step-form">
            <div className="field">
              <div className="field-head">
                <span>Response</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={useExpr}
                    onChange={(event) => setExprMode(event.target.checked)}
                  />
                  pakai $expr
                </label>
              </div>

              {useExpr ? (
                <>
                  <textarea
                    className="input mono"
                    rows={6}
                    placeholder="({ text: `Halo ${context.suhu}` })"
                    value={response.$expr ?? ""}
                    onChange={(event) => patchResponse({ $expr: event.target.value })}
                  />
                  <small className="muted">
                    Dievaluasi backend dengan `context` session. Hasilnya payload utuh,
                    jadi text/photo/tombol di bawah diabaikan.
                  </small>
                </>
              ) : (
                <>
                  <input
                    className="input mono"
                    placeholder="URL photo (kosongkan untuk pesan text)"
                    value={response.photo ?? ""}
                    onChange={(event) =>
                      patchResponse({ photo: event.target.value || undefined })
                    }
                  />
                  {response.photo ? (
                    <input
                      className="input"
                      placeholder="caption"
                      value={response.caption ?? ""}
                      onChange={(event) =>
                        patchResponse({ caption: event.target.value || undefined })
                      }
                    />
                  ) : (
                    <textarea
                      className="input"
                      rows={4}
                      placeholder="text pesan"
                      value={response.text ?? ""}
                      onChange={(event) =>
                        patchResponse({ text: event.target.value || undefined })
                      }
                    />
                  )}
                  <small className="muted">
                    {response.photo
                      ? "Photo diisi → backend kirim sendPhoto, `text` tidak dipakai."
                      : "Tanpa photo dan text, backend melempar “Invalid payload”."}
                  </small>
                </>
              )}
            </div>

            <div className="field">
              <span>Keyboard</span>
              <div className="segmented">
                {(["none", "inline", "reply"] as KeyboardMode[]).map((mode) => (
                  <button
                    key={mode}
                    className={keyboardMode === mode ? "active" : ""}
                    onClick={() => setKeyboardMode(mode)}
                  >
                    {mode === "none" ? "tanpa" : mode}
                  </button>
                ))}
              </div>

              {keyboardMode !== "none" && (
                <div className="rows-editor">
                  {rows().map((row, rowIndex) => (
                    <div className="button-row" key={rowIndex}>
                      {row.map((button, buttonIndex) => {
                        const isUrl = keyboardMode === "inline" && !!button.url;
                        return (
                          <div className="button-item" key={buttonIndex}>
                            <input
                              className="input"
                              placeholder="teks"
                              value={button.text}
                              onChange={(event) =>
                                patchButton(rowIndex, buttonIndex, { text: event.target.value })
                              }
                            />

                            {keyboardMode === "inline" ? (
                              <>
                                <select
                                  className="input select"
                                  value={isUrl ? "url" : "callback"}
                                  onChange={(event) =>
                                    patchButton(rowIndex, buttonIndex, {
                                      url: undefined,
                                      callback_data:
                                        event.target.value === "callback" ? "" : undefined,
                                    })
                                  }
                                >
                                  <option value="callback">callback</option>
                                  <option value="url">url</option>
                                </select>
                                <input
                                  className="input mono grow"
                                  placeholder={isUrl ? "https://…" : "callback_data"}
                                  value={isUrl ? (button.url ?? "") : (button.callback_data ?? "")}
                                  onChange={(event) =>
                                    patchButton(
                                      rowIndex,
                                      buttonIndex,
                                      isUrl
                                        ? { url: event.target.value }
                                        : { callback_data: event.target.value },
                                    )
                                  }
                                />
                              </>
                            ) : (
                              <label className="switch compact">
                                <input
                                  type="checkbox"
                                  checked={!!button.request_location}
                                  onChange={(event) =>
                                    patchButton(rowIndex, buttonIndex, {
                                      request_location: event.target.checked || undefined,
                                    })
                                  }
                                />
                                lokasi
                              </label>
                            )}

                            <button
                              className="icon-btn danger"
                              title="Hapus tombol"
                              onClick={() => removeButton(rowIndex, buttonIndex)}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                      <button className="btn tiny" onClick={() => addButton(rowIndex)}>
                        + tombol
                      </button>
                    </div>
                  ))}
                  <button className="btn tiny" onClick={addRow}>
                    + baris
                  </button>
                </div>
              )}

              {keyboardMode === "inline" && (
                <small className="muted">
                  `callback_data` harus sama dengan ID step tujuan supaya alur lanjut.
                </small>
              )}
            </div>

            <div className="field">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={httpOpen}
                  onChange={(event) => toggleHttp(event.target.checked)}
                />
                panggil HTTP sebelum kirim
              </label>

              {httpOpen && step.http && (
                <div className="http-box">
                  <div className="row">
                    <select
                      className="input select"
                      value={step.http.config.method ?? "GET"}
                      onChange={(event) =>
                        patchHttp({
                          config: { ...step.http!.config, method: event.target.value },
                        })
                      }
                    >
                      {METHODS.map((method) => (
                        <option key={method}>{method}</option>
                      ))}
                    </select>
                    <input
                      className="input mono grow"
                      placeholder="https://api.example.com/data"
                      value={step.http.config.url ?? ""}
                      onChange={(event) =>
                        patchHttp({ config: { ...step.http!.config, url: event.target.value } })
                      }
                    />
                  </div>

                  <input
                    className="input mono"
                    placeholder="context key, mis. info_cuaca_api"
                    value={step.http.context ?? ""}
                    onChange={(event) => patchHttp({ context: event.target.value || undefined })}
                  />
                  <small className="muted">
                    Status + body respons disimpan ke `session.context[key]`, lalu bisa dipakai
                    di $expr.
                  </small>

                  <textarea
                    className="input mono"
                    rows={5}
                    placeholder='body JSON, mis. {"q": "jakarta"}'
                    value={bodyText}
                    onChange={(event) => changeBody(event.target.value)}
                  />
                  {bodyError && <p className="error small">JSON tidak valid: {bodyError}</p>}
                </div>
              )}
            </div>

            <div className="field">
              <span>Tangkap balasan user</span>
              <input
                className="input mono"
                placeholder="context key, mis. request_location"
                value={step.context ?? ""}
                onChange={(event) => patch({ context: event.target.value || undefined })}
              />
              <small className="muted">
                Kalau diisi, pesan user yang me-reply pesan ini disimpan ke context dengan key
                tersebut.
              </small>
            </div>
          </div>

          <aside className="step-preview">
            <div className="preview-label">Pratinjau</div>
            <Preview step={step} />
          </aside>
        </div>
      )}
    </section>
  );
}
