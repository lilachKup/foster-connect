import { useEffect, useState } from "react";
import client, { apiError } from "../api/client.js";

const STATUS_FILTERS = ["pending", "approved", "rejected", "suspended", "all"];

const STATUS_LABELS = {
  pending: "ממתין לאישור",
  approved: "מאושר",
  rejected: "נדחה",
  suspended: "מושעה",
  all: "הכל",
};

function OrgRow({ org, onUpdated }) {
  const [notes, setNotes] = useState(org.admin_notes || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(approval_status) {
    setBusy(true);
    setError("");
    try {
      const res = await client.patch(`/admin/organizations/${org.id}/status`, {
        approval_status,
        admin_notes: notes || null,
      });
      onUpdated(res.data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  const contact = [org.contact_person, org.phone, org.email]
    .filter(Boolean)
    .join(" · ");
  const location = [org.street, org.house_number, org.city, org.zip_code]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="card">
      <div className="row-between">
        <h3 style={{ margin: 0 }}>{org.org_name}</h3>
        <span className={`badge ${org.approval_status}`}>
          {STATUS_LABELS[org.approval_status] || org.approval_status}
        </span>
      </div>
      {contact && <p className="muted" style={{ margin: "6px 0" }}>{contact}</p>}
      {location && <p className="muted" style={{ margin: "6px 0" }}>{location}</p>}
      <div className="muted" style={{ fontSize: "0.85rem" }}>
        {[
          org.website_url && ["אתר", org.website_url],
          org.instagram_url && ["אינסטגרם", org.instagram_url],
          org.other_link && ["קישור אחר", org.other_link],
        ]
          .filter(Boolean)
          .map(([label, url], i, arr) => (
            <span key={label}>
              <a href={url} target="_blank" rel="noreferrer">
                {label}
              </a>
              {i < arr.length - 1 && " · "}
            </span>
          ))}
      </div>

      {error && <div className="alert error" style={{ marginTop: 10 }}>{error}</div>}

      <div className="field" style={{ marginTop: 12 }}>
        <label>הערות מנהל המערכת</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="actions-row">
        <button
          className="btn"
          disabled={busy || org.approval_status === "approved"}
          onClick={() => updateStatus("approved")}
        >
          אישור
        </button>
        <button
          className="btn secondary"
          disabled={busy || org.approval_status === "rejected"}
          onClick={() => updateStatus("rejected")}
        >
          דחייה
        </button>
        <button
          className="btn danger"
          disabled={busy || org.approval_status === "suspended"}
          onClick={() => updateStatus("suspended")}
        >
          השעיה
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [orgs, setOrgs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load(filter) {
    setLoading(true);
    setError("");
    const params = filter === "all" ? {} : { status: filter };
    client
      .get("/admin/organizations", { params })
      .then((res) => setOrgs(res.data))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(statusFilter);
  }, [statusFilter]);

  // When an org's status changes, refresh the list against the current filter.
  function handleUpdated() {
    load(statusFilter);
  }

  return (
    <div>
      <h2 className="page-title">ניהול עמותות/ארגונים</h2>

      <div className="actions-row" style={{ marginBottom: 16 }}>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            className={`btn ${statusFilter === s ? "" : "secondary"}`}
            onClick={() => setStatusFilter(s)}
          >
            {STATUS_LABELS[s] || s}
          </button>
        ))}
      </div>

      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <p className="muted">טוען…</p>
      ) : orgs.length === 0 ? (
        <p className="muted">
          אין ארגונים בסטטוס "{STATUS_LABELS[statusFilter] || statusFilter}".
        </p>
      ) : (
        <div className="result-list">
          {orgs.map((org) => (
            <OrgRow key={org.id} org={org} onUpdated={handleUpdated} />
          ))}
        </div>
      )}
    </div>
  );
}
