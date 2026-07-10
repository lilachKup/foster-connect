import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { apiError } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import FosterFields, {
  EMPTY_FOSTER,
  fosterToForm,
  formToFoster,
} from "../components/FosterFields.jsx";

export default function FosterProfile() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ ...EMPTY_FOSTER });
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    client
      .get("/fosters/me")
      .then((res) => {
        setProfile(fosterToForm(res.data));
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
      setProfile(fosterToForm(res.data));
      setStatus(res.data.profile_status);
      setMessage("Profile saved.");
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
        newStatus === "paused" ? "Profile paused." : "Profile reactivated."
      );
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "Delete your foster profile? Organizations will no longer see it."
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

  if (loading) return <div className="container">Loading…</div>;

  return (
    <div>
      <div className="row-between">
        <h2 className="page-title">My foster profile</h2>
        <span className={`badge ${status === "active" ? "approved" : "pending"}`}>
          {status}
        </span>
      </div>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <form onSubmit={handleSave}>
        <FosterFields values={profile} set={set} />
        <div className="actions-row">
          <button className="btn" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
          {status === "active" ? (
            <button
              type="button"
              className="btn secondary"
              onClick={() => setProfileStatus("paused")}
            >
              Pause profile
            </button>
          ) : status === "paused" ? (
            <button
              type="button"
              className="btn secondary"
              onClick={() => setProfileStatus("active")}
            >
              Reactivate profile
            </button>
          ) : null}
          <button type="button" className="btn danger" onClick={handleDelete}>
            Delete profile
          </button>
        </div>
      </form>
    </div>
  );
}
