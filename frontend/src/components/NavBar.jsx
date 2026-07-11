import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        🐾 FosterConnect
      </Link>
      <div className="nav-links">
        {!user && (
          <>
            <Link to="/register/foster">הצטרפות כמשפחה אומנת</Link>
            <Link to="/register/organization">רישום עמותה/ארגון</Link>
            <Link to="/login" className="btn small">
              כניסה
            </Link>
          </>
        )}
        {user?.role === "foster" && <Link to="/foster">הפרופיל שלי</Link>}
        {user?.role === "organization" && (
          <Link to="/organization">חיפוש משפחות אומנה</Link>
        )}
        {user?.role === "admin" && (
          <>
            <Link to="/admin">ניהול עמותות/ארגונים</Link>
            <Link to="/admin/fosters">ניהול משפחות אומנה</Link>
          </>
        )}
        {user && (
          <>
            <span className="nav-user">{user.email}</span>
            <button className="link-button" onClick={handleLogout}>
              התנתקות
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
