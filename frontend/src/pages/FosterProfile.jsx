import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { apiError } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import FosterFields, {
  EMPTY_FOSTER,
  fosterToForm,
  formToFoster,
} from "../components/FosterFields.jsx";

const STATUS_LABELS = { active: "פעיל", paused: "מושהה" };

export default function FosterProfile() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ ...EMPTY_FOSTER });
  const [savedProfile, setSavedProfile] = useState({ ...EMPTY_FOSTER });
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const isDirty = JSON.stringify(profile) !== JSON.stringify(savedProfile);

  useEffect(() => {
    client
      .get("/fosters/me")
      .then((res) => {
        const form = fosterToForm(res.data);
        setProfile(form);
        setSavedProfile(form);
        setStatus(res.data.profile_status);
      })
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  function set(name, value) {
    setProfile((p) => ({ ...p, [name]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const res = await client.put("/fosters/me", formToFoster(profile));
      const form = fosterToForm(res.data);
      setProfile(form);
      setSavedProfile(form);
      setStatus(res.data.profile_status);
      setMessage("הפרופיל נשמר.");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function setProfileStatus(newStatus) {
    setError("");
    setMessage("");
    try {
      const res = await client.patch("/fosters/me/availability", {
        profile_status: newStatus,
      });
      setStatus(res.data.profile_status);
      setMessage(
        newStatus === "paused" ? "הפרופיל הושהה." : "הפרופיל הופעל מחדש."
      );
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "למחוק את פרופיל האומנה שלך? ארגונים לא יראו אותו יותר."
      )
    ) {
      return;
    }
    try {
      await client.delete("/fosters/me");
      logout();
      navigate("/");
    } catch (err) {
      setError(apiError(err));
    }
  }

  if (loading) return <div className="container">טוען…</div>;

  return (
    <div>
      <div className="row-between">
        <h2 className="page-title">פרופיל האומנה שלי</h2>
        <span className={`badge ${status === "active" ? "approved" : "pending"}`}>
          {STATUS_LABELS[status] || status}
        </span>
      </div>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <form onSubmit={handleSave}>
        <FosterFields values={profile} set={set} />
        <div className="actions-row">
          <button className="btn" disabled={busy || !isDirty}>
            {busy ? "שומר/ת…" : "שמירת שינויים"}
          </button>
          {status === "active" ? (
            <button
              type="button"
              className="btn warn"
              onClick={() => setProfileStatus("paused")}
            >
              השהיית פרופיל
            </button>
          ) : status === "paused" ? (
            <button
              type="button"
              className="btn secondary"
              onClick={() => setProfileStatus("active")}
            >
              הפעלת פרופיל מחדש
            </button>
          ) : null}
          <button type="button" className="btn danger" onClick={handleDelete}>
            מחיקת פרופיל
          </button>
        </div>
      </form>
    </div>
  );
}
