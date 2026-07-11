import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { apiError } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import PasswordField from "../components/PasswordField.jsx";

const EMPTY = {
  org_name: "",
  contact_person: "",
  phone: "",
  email: "",
  website_url: "",
  instagram_url: "",
  other_link: "",
  city: "",
  street: "",
  house_number: "",
  zip_code: "",
};

export default function OrgRegister() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState({ account_email: "", password: "" });
  const [org, setOrg] = useState({ ...EMPTY });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(name, value) {
    setOrg((o) => ({ ...o, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!org.website_url.trim() && !org.instagram_url.trim() && !org.other_link.trim()) {
      setError(
        "יש לספק לפחות אחד מהבאים: אתר, אינסטגרם, או קישור אחר (המוכיח שהארגון הוא עמותה רשומה)."
      );
      return;
    }
    setBusy(true);
    try {
      const payload = { ...account };
      for (const [k, v] of Object.entries(org)) {
        payload[k] = v.trim() === "" ? null : v;
      }
      payload.org_name = org.org_name;
      const res = await client.post("/auth/register/organization", payload);
      await setToken(res.data.access_token);
      navigate("/organization");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="page-title">רישום הארגון שלכם</h2>
      <p className="muted">
        לאחר ההרשמה, מנהל המערכת יבדוק את הארגון שלכם. תוכלו לחפש משפחות
        אומנה לאחר קבלת האישור.
      </p>
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

        <fieldset>
          <legend>פרטי הארגון</legend>
          <div className="grid">
            <div className="field">
              <label>שם הארגון *</label>
              <input
                type="text"
                value={org.org_name}
                onChange={(e) => set("org_name", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>איש קשר *</label>
              <input
                type="text"
                value={org.contact_person}
                onChange={(e) => set("contact_person", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>טלפון *</label>
              <input
                type="tel"
                value={org.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>אימייל ליצירת קשר</label>
              <input
                type="email"
                value={org.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div className="field">
              <label>כתובת אתר</label>
              <input
                type="url"
                value={org.website_url}
                onChange={(e) => set("website_url", e.target.value)}
              />
            </div>
            <div className="field">
              <label>כתובת אינסטגרם</label>
              <input
                type="url"
                value={org.instagram_url}
                onChange={(e) => set("instagram_url", e.target.value)}
              />
            </div>
            <div className="field">
              <label>קישור אחר</label>
              <input
                type="url"
                placeholder="למשל עמוד פייסבוק, רישום במאגר עמותות"
                value={org.other_link}
                onChange={(e) => set("other_link", e.target.value)}
              />
            </div>
          </div>
          <p className="muted" style={{ fontSize: "0.85rem", marginTop: 4 }}>
            נדרש לפחות אחד מבין: אתר / אינסטגרם / קישור אחר, כדי לעזור לוודא
            שהארגון הוא עמותה רשומה.
          </p>
        </fieldset>

        <fieldset>
          <legend>כתובת</legend>
          <div className="grid">
            <div className="field">
              <label>עיר *</label>
              <input
                type="text"
                value={org.city}
                onChange={(e) => set("city", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>רחוב *</label>
              <input
                type="text"
                value={org.street}
                onChange={(e) => set("street", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>מספר בית *</label>
              <input
                type="text"
                value={org.house_number}
                onChange={(e) => set("house_number", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>מיקוד</label>
              <input
                type="text"
                value={org.zip_code}
                onChange={(e) => set("zip_code", e.target.value)}
              />
            </div>
          </div>
        </fieldset>

        <button className="btn" disabled={busy}>
          {busy ? "נרשם/ת…" : "רישום הארגון"}
        </button>
      </form>
    </div>
  );
}
