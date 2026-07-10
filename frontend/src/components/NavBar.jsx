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
            <Link to="/login">Log in</Link>
            <Link to="/register/foster">Become a foster</Link>
            <Link to="/register/organization">Register organization</Link>
          </>
        )}
        {user?.role === "foster" && <Link to="/foster">My profile</Link>}
        {user?.role === "organization" && <Link to="/organization">Dashboard</Link>}
        {user?.role === "admin" && <Link to="/admin">Admin</Link>}
        {user && (
          <>
            <span className="nav-user">{user.email}</span>
            <button className="link-button" onClick={handleLogout}>
              Log out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
