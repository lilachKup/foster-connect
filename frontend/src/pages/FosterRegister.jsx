import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { apiError } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import FosterFields, {
  EMPTY_FOSTER,
  formToFoster,
} from "../components/FosterFields.jsx";
import PasswordField from "../components/PasswordField.jsx";

export default function FosterRegister() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState({ account_email: "", password: "" });
  const [profile, setProfile] = useState({ ...EMPTY_FOSTER });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(name, value) {
    setProfile((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = {
        ...formToFoster(profile),
        account_email: account.account_email,
        password: account.password,
      };
      const res = await client.post("/auth/register/foster", payload);
      await setToken(res.data.access_token);
      navigate("/foster");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="page-title">הצטרפות כמשפחה אומנת</h2>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>פרטי חשבון</legend>
          <div className="grid">
            <div className="field">
              <label>אימייל להתחברות *</label>
              <input
                type="email"
                value={account.account_email}
                onChange={(e) =>
                  setAccount((a) => ({ ...a, account_email: e.target.value }))
                }
                required
              />
            </div>
            <PasswordField
              label="סיסמה * (לפחות 6 תווים)"
              value={account.password}
              onChange={(e) =>
                setAccount((a) => ({ ...a, password: e.target.value }))
              }
              autoComplete="new-password"
              minLength={6}
              maxLength={72}
              required
            />
          </div>
        </fieldset>

        <FosterFields values={profile} set={set} />

        <button className="btn" disabled={busy}>
          {busy ? "יוצר/ת…" : "יצירת פרופיל אומנה"}
        </button>
      </form>
    </div>
  );
}
