import { useState } from "react";

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19.5C5 19.5 1.5 12 1.5 12a20.3 20.3 0 0 1 4.72-5.94M9.9 4.72A10.9 10.9 0 0 1 12 4.5c7 0 10.5 7.5 10.5 7.5a20.3 20.3 0 0 1-2.36 3.44M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <path d="M1.5 1.5l21 21" />
  </svg>
);

export default function PasswordField({
  label,
  value,
  onChange,
  required,
  minLength,
  maxLength,
  autoComplete,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div className="password-input">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "הסתר סיסמה" : "הצג סיסמה"}
          tabIndex={-1}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}
