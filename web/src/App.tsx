import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { cloneFlow, emptyFlow, validateFlow } from "./flow-utils";
import type { FlowConfig } from "./types";
import { FlowList } from "./components/FlowList";
import { FlowEditor } from "./components/FlowEditor";

export default function App() {
  const [flows, setFlows] = useState<FlowConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [draft, setDraft] = useState<FlowConfig | null>(null);
  const [originalId, setOriginalId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .listFlows()
      .then((list) => {
        if (!active) return;
        setFlows(list);
        setLoading(false);
      })
      .catch((error: Error) => {
        if (!active) return;
        setLoadError(error.message);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const errors = useMemo(() => {
    if (!draft) return [];
    const others = flows.filter((item) =>
      originalId === null ? item.id !== draft.id : item.id !== originalId,
    );
    return validateFlow(draft, others);
  }, [draft, flows, originalId]);

  function selectFlow(flow: FlowConfig) {
    if (dirty && !confirm("Perubahan belum disimpan. Buang?")) return;
    setDraft(cloneFlow(flow));
    setOriginalId(flow.id);
    setDirty(false);
    setActionError(null);
    setSavedAt(null);
  }

  function createFlow() {
    if (dirty && !confirm("Perubahan belum disimpan. Buang?")) return;
    setDraft(emptyFlow());
    setOriginalId(null);
    setDirty(false);
    setActionError(null);
    setSavedAt(null);
  }

  function changeFlow(next: FlowConfig) {
    setDraft(next);
    setDirty(true);
    setSavedAt(null);
  }

  async function save() {
    if (!draft || errors.length > 0) return;
    setSaving(true);
    setActionError(null);
    try {
      const saved = await api.saveFlow(draft);
      const list = await api.listFlows();
      setFlows(list);
      setDraft(cloneFlow(saved));
      setOriginalId(saved.id);
      setDirty(false);
      setSavedAt(new Date().toLocaleTimeString("id-ID"));
    } catch (error) {
      setActionError((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!draft || originalId === null) return;
    if (!confirm(`Hapus flow "${originalId}"? Tidak bisa dibatalkan.`)) return;
    setSaving(true);
    setActionError(null);
    try {
      await api.deleteFlow(originalId);
      setFlows(await api.listFlows());
      setDraft(null);
      setOriginalId(null);
      setDirty(false);
    } catch (error) {
      setActionError((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-dot" />
          Flow Config
        </div>

        <div className="mode-badge">
          {api.mock ? "mock · localStorage" : "live · API"}
        </div>

        {loading ? (
          <p className="muted pad">Memuat…</p>
        ) : loadError ? (
          <p className="error pad">{loadError}</p>
        ) : (
          <FlowList
            flows={flows}
            selectedId={originalId}
            onCreate={createFlow}
            onSelect={selectFlow}
          />
        )}
      </aside>

      <main className="main">
        {draft ? (
          <FlowEditor
            flow={draft}
            isNew={originalId === null}
            errors={errors}
            saving={saving}
            actionError={actionError}
            savedAt={savedAt}
            dirty={dirty}
            onChange={changeFlow}
            onSave={save}
            onDelete={remove}
            onCancel={() => {
              if (dirty && !confirm("Buang perubahan?")) return;
              setDraft(null);
              setOriginalId(null);
              setDirty(false);
              setActionError(null);
            }}
          />
        ) : (
          <div className="empty-state">
            <h1>FlowConfig</h1>
            <p className="muted">
              Pilih flow di kiri, atau buat flow baru. Semua perubahan di sini
              disimpan ke repository flow di backend.
            </p>
            <button className="btn primary" onClick={createFlow}>
              + Flow baru
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
