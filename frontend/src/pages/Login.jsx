import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { apiError } from "../api/client.js";
import PasswordField from "../components/PasswordField.jsx";

const HOME_BY_ROLE = {
  foster: "/foster",
  organization: "/organization",
  admin: "/admin",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(HOME_BY_ROLE[user.role] || "/");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}>
      <h2 className="page-title">כניסה</h2>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>אימייל</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <PasswordField
            label="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button className="btn" style={{ marginTop: 16 }} disabled={busy}>
          {busy ? "מתחבר/ת…" : "כניסה"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 16 }}>
        אין לך חשבון? <Link to="/register/foster">הצטרפות כמשפחה אומנת</Link>{" "}
        או <Link to="/register/organization">רישום עמותה/ארגון</Link>.
      </p>
    </div>
  );
}
