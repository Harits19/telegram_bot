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

  async function reload() {
    setLoading(true);
    setLoadError(null);
    try {
      setFlows(await api.listFlows());
    } catch (error) {
      setLoadError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api
      .listFlows()
      .then((list) => {
        if (active) setFlows(list);
      })
      .catch((error: Error) => {
        if (active) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const errors = useMemo(() => (draft ? validateFlow(draft) : []), [draft]);

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
    if (!confirm(`Hapus flow ini? ${draft.steps.length} step ikut terhapus.`)) return;
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
          <span className="brand-dot" aria-hidden="true" />
          Flow Config
        </div>

        {loading ? (
          <p className="muted pad">Memuat flow…</p>
        ) : loadError ? (
          <div className="pad">
            <p className="error">Gagal memuat flow: {loadError}</p>
            <p className="muted small">
              Pastikan backend jalan (<code>npm start</code>) dan MongoDB menyala.
            </p>
            <button className="btn" onClick={() => void reload()}>
              Coba lagi
            </button>
          </div>
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
              Pilih flow di kiri, atau buat flow baru. Setiap simpan langsung
              menulis ke MongoDB lewat <code>/api/flows</code>, dan bot memakai
              data yang sama saat pesan masuk.
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
