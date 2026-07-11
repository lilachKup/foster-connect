import { useEffect, useState } from "react";
import client, { apiError } from "../api/client.js";
import { MAX_FOSTER_DURATION_OPTIONS } from "../components/FosterFields.jsx";

const MAX_FOSTER_DURATION_LABELS = Object.fromEntries(
  MAX_FOSTER_DURATION_OPTIONS.map((o) => [o.value, o.label])
);

const APPROVAL_STATUS_LABELS = {
  pending: "ממתין לאישור",
  approved: "מאושר",
  rejected: "נדחה",
  suspended: "מושעה",
};

const EMPTY_FILTERS = {
  city: "",
  can_foster_dogs: false,
  can_foster_cats: false,
  max_dog_weight: "",
  emergency_foster_available: false,
  has_car: false,
  has_experience: false,
};

function FosterCard({ f }) {
  const tags = [];
  if (f.can_foster_dogs) tags.push("כלבים");
  if (f.can_foster_cats) tags.push("חתולים");
  if (f.max_dog_weight_kg) tags.push(`עד ${f.max_dog_weight_kg} ק"ג`);
  if (f.has_car) tags.push("יש רכב");
  if (f.emergency_foster_available) tags.push("חירום");
  if (f.previous_experience) tags.push("בעל/ת נסיון");

  const location = [f.city, f.nearby_city && `(${f.nearby_city})`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="card">
      <h3 style={{ margin: 0 }}>{f.full_name}</h3>
      {location && <p className="muted" style={{ margin: "6px 0" }}>{location}</p>}
      <div className="tag-row">
        {tags.map((t) => (
          <span className="tag" key={t}>
            {t}
          </span>
        ))}
      </div>
      <div className="muted" style={{ marginTop: 10, fontSize: "0.85rem" }}>
        {f.phone && <span>📞 {f.phone} &nbsp;</span>}
        {f.email && <span>✉️ {f.email}</span>}
      </div>
      {f.max_foster_duration && (
        <p className="muted" style={{ fontSize: "0.85rem", marginTop: 6 }}>
          {MAX_FOSTER_DURATION_LABELS[f.max_foster_duration] || f.max_foster_duration}
        </p>
      )}
      {f.notes && <p style={{ marginTop: 8 }}>{f.notes}</p>}
    </div>
  );
}

export default function OrgDashboard() {
  const [org, setOrg] = useState(null);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    client
      .get("/organizations/me")
      .then((res) => setOrg(res.data))
      .catch((err) => setError(apiError(err)));
  }, []);

  function set(name, value) {
    setFilters((f) => ({ ...f, [name]: value }));
  }

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const params = {};
      for (const [k, v] of Object.entries(filters)) {
        if (v === "" || v === false) continue;
        params[k] = v;
      }
      const res = await client.get("/fosters", { params });
      setResults(res.data);
      setSearched(true);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  const approved = org?.approval_status === "approved";

  return (
    <div>
      <div className="row-between">
        <h2 className="page-title">{org ? org.org_name : "ארגון"}</h2>
        {org && (
          <span className={`badge ${org.approval_status}`}>
            {APPROVAL_STATUS_LABELS[org.approval_status] || org.approval_status}
          </span>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}

      {org && !approved && (
        <div
          className={`alert ${org.approval_status === "pending" ? "warn" : "error"}`}
        >
          הארגון שלכם{" "}
          <strong>
            {APPROVAL_STATUS_LABELS[org.approval_status] || org.approval_status}
          </strong>
          . תוכלו לחפש משפחות אומנה לאחר אישור מנהל המערכת.
          {org.admin_notes && (
            <div style={{ marginTop: 6 }}>הערות מנהל המערכת: {org.admin_notes}</div>
          )}
        </div>
      )}

      {approved && (
        <>
          <form className="card" onSubmit={handleSearch}>
            <h3 style={{ marginTop: 0 }}>חיפוש משפחות אומנה</h3>
            <div className="grid">
              <div className="field">
                <label>עיר</label>
                <input
                  type="text"
                  value={filters.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </div>
              <div className="field">
                <label>משקל הכלב</label>
                <select
                  value={filters.max_dog_weight}
                  onChange={(e) => set("max_dog_weight", e.target.value)}
                >
                  <option value="">הכל</option>
                  <option value="5">עד 5 ק"ג</option>
                  <option value="10">עד 10 ק"ג</option>
                  <option value="15">עד 15 ק"ג</option>
                  <option value="20">עד 20 ק"ג</option>
                  <option value="25">עד 25 ק"ג</option>
                  <option value="30">עד 30 ק"ג</option>
                  <option value="31">מעל 30 ק"ג</option>
                </select>
              </div>
            </div>
            <div className="grid" style={{ marginTop: 12 }}>
              <div className="field checkbox">
                <input
                  id="f_dogs"
                  type="checkbox"
                  checked={filters.can_foster_dogs}
                  onChange={(e) => set("can_foster_dogs", e.target.checked)}
                />
                <label htmlFor="f_dogs">יכולים לשמש בית אומנה לכלבים</label>
              </div>
              <div className="field checkbox">
                <input
                  id="f_cats"
                  type="checkbox"
                  checked={filters.can_foster_cats}
                  onChange={(e) => set("can_foster_cats", e.target.checked)}
                />
                <label htmlFor="f_cats">יכולים לשמש בית אומנה לחתולים</label>
              </div>
              <div className="field checkbox">
                <input
                  id="f_emergency"
                  type="checkbox"
                  checked={filters.emergency_foster_available}
                  onChange={(e) =>
                    set("emergency_foster_available", e.target.checked)
                  }
                />
                <label htmlFor="f_emergency">זמינים לאומנת חירום</label>
              </div>
              <div className="field checkbox">
                <input
                  id="f_car"
                  type="checkbox"
                  checked={filters.has_car}
                  onChange={(e) => set("has_car", e.target.checked)}
                />
                <label htmlFor="f_car">יש רכב</label>
              </div>
              <div className="field checkbox">
                <input
                  id="f_exp"
                  type="checkbox"
                  checked={filters.has_experience}
                  onChange={(e) => set("has_experience", e.target.checked)}
                />
                <label htmlFor="f_exp">בעלי נסיון</label>
              </div>
            </div>
            <div className="actions-row">
              <button className="btn" disabled={busy}>
                {busy ? "מחפש/ת…" : "חיפוש"}
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setFilters({ ...EMPTY_FILTERS })}
              >
                איפוס סינון
              </button>
            </div>
          </form>

          {searched && (
            <p className="muted">
              נמצאו {results.length} {results.length === 1 ? "משפחה אומנת" : "משפחות אומנה"}
            </p>
          )}
          <div className="result-list">
            {results.map((f) => (
              <FosterCard key={f.id} f={f} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
