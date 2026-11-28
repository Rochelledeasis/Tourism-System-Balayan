import { useCallback, useEffect, useState } from "react";
import { CLIENT_TYPES, SCALE, SQD } from "./surveyData.js";
import { API_BASE } from "./api.js";

// 2.2.2 Implement survey response management (Frontend)
// List + filters (date, service, client type), detail view, CSV export,
// with loading, error and empty states.

const KEY_STORAGE = "tob-admin-key";

const NO_FILTERS = { from: "", to: "", service: "", clientType: "" };

const formatDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("en-PH");
};

const toQuery = (filters) => {
  const q = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => v && q.set(k, v));
  const s = q.toString();
  return s ? `?${s}` : "";
};

export default function ResponsesPage() {
  // Only authorized personnel: the backend checks this access key (ADMIN_KEY in BACKEND/.env)
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(KEY_STORAGE) || "");
  const [keyInput, setKeyInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [draft, setDraft] = useState(NO_FILTERS);       // what is typed in the filter bar
  const [applied, setApplied] = useState(NO_FILTERS);   // what the list is currently using
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const headers = { "x-admin-key": adminKey };

  const lockOut = useCallback((message) => {
    sessionStorage.removeItem(KEY_STORAGE);
    setAdminKey("");
    setSelected(null);
    setRows([]);
    setAuthError(message);
  }, []);

  const load = useCallback(async (filters) => {
    if (!adminKey) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/survey-responses${toQuery(filters)}`, { headers: { "x-admin-key": adminKey } });
      if (res.status === 401) return lockOut("Invalid access key. Please try again.");
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      setRows(result.data);
    } catch (err) {
      setRows([]);
      setError(err.message || "Hindi makakonekta sa server. Siguraduhing tumatakbo ang backend.");
    } finally {
      setLoading(false);
    }
  }, [adminKey, lockOut]);

  useEffect(() => { load(applied); }, [applied, load]);

  const signIn = (e) => {
    e.preventDefault();
    const k = keyInput.trim();
    if (!k) return setAuthError("Please enter the access key.");
    sessionStorage.setItem(KEY_STORAGE, k);
    setAuthError("");
    setKeyInput("");
    setAdminKey(k);
  };

  const signOut = () => lockOut("");

  const setField = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const applyFilters = (e) => {
    e.preventDefault();
    setApplied(draft);
  };

  const clearFilters = () => {
    setDraft(NO_FILTERS);
    setApplied(NO_FILTERS);
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    setSelected({ id });
    try {
      const res = await fetch(`${API_BASE}/survey-responses/${id}`, { headers });
      if (res.status === 401) { setSelected(null); return lockOut("Invalid access key. Please try again."); }
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      setSelected(result.data);
    } catch (err) {
      setSelected(null);
      alert(err.message || "Hindi makuha ang detalye ng sagot.");
    } finally {
      setDetailLoading(false);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/survey-responses/export${toQuery(applied)}`, { headers });
      if (res.status === 401) return lockOut("Invalid access key. Please try again.");
      if (!res.ok) throw new Error("Hindi na-export ang mga sagot.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "survey-responses.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setExporting(false);
    }
  };

  const hasFilters = Object.values(applied).some(Boolean);

  if (!adminKey) {
    return (
      <main className="container" id="responses">
        <form className="card gate" onSubmit={signIn}>
          <h2 className="section-title">Authorized personnel only</h2>
          <p className="muted">Enter the access key to view and manage survey responses.</p>
          <div className="field">
            <label className="label" htmlFor="admin-key">Access key</label>
            <input id="admin-key" type="password" className="input" autoComplete="off"
              value={keyInput} onChange={(e) => setKeyInput(e.target.value)} />
            {authError && <p className="field-error" role="alert">{authError}</p>}
          </div>
          <button type="submit" className="btn btn-primary">Continue</button>
        </form>
      </main>
    );
  }

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="eyebrow">AUTHORIZED PERSONNEL</p>
          <h1>Survey responses</h1>
          <p className="hero-text">
            Review the Client Satisfaction Measurement (CSM) responses submitted by clients.
          </p>
        </div>
      </section>

      <main className="container" id="responses">
        {/* FILTERS */}
        <form className="card" onSubmit={applyFilters}>
          <div className="filters">
            <div className="field">
              <label className="label" htmlFor="f-from">Date from</label>
              <input id="f-from" type="date" className="input" value={draft.from}
                onChange={(e) => setField("from", e.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="f-to">Date to</label>
              <input id="f-to" type="date" className="input" value={draft.to}
                onChange={(e) => setField("to", e.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="f-service">Service</label>
              <input id="f-service" className="input" placeholder="Search service" value={draft.service}
                onChange={(e) => setField("service", e.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="f-client">Client type</label>
              <select id="f-client" className="input" value={draft.clientType}
                onChange={(e) => setField("clientType", e.target.value)}>
                <option value="">All</option>
                {CLIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="submit-row">
            <button type="submit" className="btn btn-primary">Apply filters</button>
            <button type="button" className="btn btn-light" onClick={clearFilters}>Clear</button>
            <button type="button" className="btn btn-light push-right" onClick={signOut}>Lock</button>
            <button type="button" className="btn btn-light" onClick={exportCsv}
              disabled={exporting || loading || rows.length === 0}>
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </form>

        {/* LIST */}
        <section className="card">
          <h2 className="section-title">
            Responses
            {!loading && !error && <span className="section-number">{rows.length} found</span>}
          </h2>

          {loading && <p className="state-box" role="status">Loading responses…</p>}
          {!loading && error && <p className="state-box state-error" role="alert">{error}</p>}
          {!loading && !error && rows.length === 0 && (
            <p className="state-box">
              {hasFilters ? "No responses match these filters." : "No survey responses yet."}
            </p>
          )}

          {!loading && !error && rows.length > 0 && (
            <div className="table-wrap">
              <table className="ratings list-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Date</th><th>Client type</th><th>Service</th><th>SQD0</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{formatDate(r.survey_date)}</td>
                      <td>{r.client_type || "—"}</td>
                      <td>{r.service || "—"}</td>
                      <td>{r.sqd0 === null || r.sqd0 === undefined ? "—" : SCALE[r.sqd0]?.join(" ")}</td>
                      <td>
                        <button type="button" className="btn btn-light btn-sm" onClick={() => openDetail(r.id)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* DETAIL */}
        {selected && (
          <section className="card" aria-live="polite">
            <h2 className="section-title">
              <span className="section-number">#{selected.id}</span>Response details
            </h2>
            {detailLoading ? (
              <p className="state-box" role="status">Loading details…</p>
            ) : (
              <>
                <dl className="detail-grid">
                  <div><dt>Client type</dt><dd>{selected.client_type || "—"}</dd></div>
                  <div><dt>Date</dt><dd>{formatDate(selected.survey_date)}</dd></div>
                  <div><dt>Sex</dt><dd>{selected.sex || "—"}</dd></div>
                  <div><dt>Age</dt><dd>{selected.age ?? "—"}</dd></div>
                  <div><dt>Region</dt><dd>{selected.region || "—"}</dd></div>
                  <div><dt>Service</dt><dd>{selected.service || "—"}</dd></div>
                  <div><dt>CC1</dt><dd>{selected.cc1 || "—"}</dd></div>
                  <div><dt>CC2</dt><dd>{selected.cc2 || "—"}</dd></div>
                  <div><dt>CC3</dt><dd>{selected.cc3 || "—"}</dd></div>
                </dl>

                <div className="table-wrap">
                  <table className="ratings list-table">
                    <thead><tr><th>Item</th><th>Statement</th><th>Rating</th></tr></thead>
                    <tbody>
                      {SQD.map((text, i) => {
                        const v = selected[`sqd${i}`];
                        return (
                          <tr key={i}>
                            <td className="sqd-id">SQD{i}</td>
                            <td>{text}</td>
                            <td>{v === null || v === undefined ? "—" : SCALE[v]?.join(" ")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="label detail-label">Suggestions</p>
                <p>{selected.suggestions || "—"}</p>
                <button type="button" className="btn btn-light" onClick={() => setSelected(null)}>Close</button>
              </>
            )}
          </section>
        )}
      </main>
    </>
  );
}
