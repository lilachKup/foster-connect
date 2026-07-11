import { useEffect, useState } from "react";
import client, { apiError } from "../api/client.js";
import { MAX_FOSTER_DURATION_OPTIONS } from "../components/FosterFields.jsx";

const MAX_FOSTER_DURATION_LABELS = Object.fromEntries(
  MAX_FOSTER_DURATION_OPTIONS.map((o) => [o.value, o.label])
);

const STATUS_FILTERS = ["active", "paused", "suspended", "deleted", "all"];

const STATUS_LABELS = {
  active: "פעיל",
  paused: "מושהה",
  suspended: "מושעה",
  deleted: "נמחק",
  all: "הכל",
};

// Reuse the existing badge color classes (approved/pending/rejected)
// instead of adding new ones per profile_status value.
const STATUS_BADGE_CLASS = {
  active: "approved",
  paused: "pending",
  suspended: "suspended",
  deleted: "rejected",
};

const EMPTY_FILTERS = {
  email: "",
  city: "",
  can_foster_dogs: false,
  can_foster_cats: false,
  max_dog_weight: "",
  emergency_foster_available: false,
  has_car: false,
  has_experience: false,
};

function FosterRow({ f, onUpdated }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function setStatus(profile_status) {
    setBusy(true);
    setError("");
    try {
      const res = await client.patch(`/admin/fosters/${f.id}/status`, {
        profile_status,
      });
      onUpdated(res.data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  const tags = [];
  if (f.can_foster_dogs) tags.push("כלבים");
  if (f.can_foster_cats) tags.push("חתולים");
  if (f.max_dog_weight_kg) tags.push(`עד ${f.max_dog_weight_kg} ק"ג`);
  if (f.has_car) tags.push("יש רכב");
  if (f.emergency_foster_available) tags.push("חירום");

  const location = [f.city, f.nearby_city && `(${f.nearby_city})`]
    .filter(Boolean)
    .join(" ");
  const contact = [f.account_email, f.phone].filter(Boolean).join(" · ");

  return (
    <div className="card">
      <div className="row-between">
        <h3 style={{ margin: 0 }}>{f.full_name}</h3>
        <span className={`badge ${STATUS_BADGE_CLASS[f.profile_status] || ""}`}>
          {STATUS_LABELS[f.profile_status] || f.profile_status}
        </span>
      </div>
      {contact && <p className="muted" style={{ margin: "6px 0" }}>{contact}</p>}
      {location && <p className="muted" style={{ margin: "6px 0" }}>{location}</p>}
      <div className="tag-row">
        {tags.map((t) => (
          <span className="tag" key={t}>
            {t}
          </span>
        ))}
      </div>
      {f.max_foster_duration && (
        <p className="muted" style={{ fontSize: "0.85rem", marginTop: 6 }}>
          {MAX_FOSTER_DURATION_LABELS[f.max_foster_duration] || f.max_foster_duration}
        </p>
      )}

      {error && <div className="alert error" style={{ marginTop: 10 }}>{error}</div>}

      <div className="actions-row">
        {f.profile_status === "suspended" ? (
          <button className="btn" disabled={busy} onClick={() => setStatus("active")}>
            ביטול השעיה
          </button>
        ) : (
          <button className="btn warn" disabled={busy} onClick={() => setStatus("suspended")}>
            השעיה
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminFosterSearch() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function set(name, value) {
    setFilters((f) => ({ ...f, [name]: value }));
  }

  function load() {
    setLoading(true);
    setError("");
    const params = { status: statusFilter === "all" ? undefined : statusFilter };
    for (const [k, v] of Object.entries(filters)) {
      if (v === "" || v === false) continue;
      params[k] = v;
    }
    client
      .get("/admin/fosters", { params })
      .then((res) => setResults(res.data))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  function handleSearch(e) {
    e.preventDefault();
    load();
  }

  function handleUpdated() {
    load();
  }

  return (
    <div>
      <h2 className="page-title">ניהול משפחות אומנה</h2>

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

      <form className="card" onSubmit={handleSearch}>
        <div className="grid">
          <div className="field">
            <label>חיפוש לפי אימייל</label>
            <input
              type="text"
              value={filters.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
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
              id="af_dogs"
              type="checkbox"
              checked={filters.can_foster_dogs}
              onChange={(e) => set("can_foster_dogs", e.target.checked)}
            />
            <label htmlFor="af_dogs">יכולים לשמש בית אומנה לכלבים</label>
          </div>
          <div className="field checkbox">
            <input
              id="af_cats"
              type="checkbox"
              checked={filters.can_foster_cats}
              onChange={(e) => set("can_foster_cats", e.target.checked)}
            />
            <label htmlFor="af_cats">יכולים לשמש בית אומנה לחתולים</label>
          </div>
          <div className="field checkbox">
            <input
              id="af_emergency"
              type="checkbox"
              checked={filters.emergency_foster_available}
              onChange={(e) => set("emergency_foster_available", e.target.checked)}
            />
            <label htmlFor="af_emergency">זמינים לאומנת חירום</label>
          </div>
          <div className="field checkbox">
            <input
              id="af_car"
              type="checkbox"
              checked={filters.has_car}
              onChange={(e) => set("has_car", e.target.checked)}
            />
            <label htmlFor="af_car">יש רכב</label>
          </div>
          <div className="field checkbox">
            <input
              id="af_exp"
              type="checkbox"
              checked={filters.has_experience}
              onChange={(e) => set("has_experience", e.target.checked)}
            />
            <label htmlFor="af_exp">בעלי נסיון</label>
          </div>
        </div>
        <div className="actions-row">
          <button className="btn">חיפוש</button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => setFilters({ ...EMPTY_FILTERS })}
          >
            איפוס סינון
          </button>
        </div>
      </form>

      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <p className="muted">טוען…</p>
      ) : results.length === 0 ? (
        <p className="muted">לא נמצאו משפחות אומנה.</p>
      ) : (
        <div className="result-list">
          {results.map((f) => (
            <FosterRow key={f.id} f={f} onUpdated={handleUpdated} />
          ))}
        </div>
      )}
    </div>
  );
}
