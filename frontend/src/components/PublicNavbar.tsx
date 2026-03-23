import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function PublicNavbar() {
  const { user, logout } = useAuth();

  return (
    <header className="top-nav">
      <Link to="/" className="brand">
        CreatorOS
      </Link>
      <nav>
        <NavLink to="/">Home</NavLink>
        {!user && <NavLink to="/login">Login</NavLink>}
        {!user && <NavLink to="/register">Register</NavLink>}
        {user && <NavLink to="/dashboard/account">Dashboard</NavLink>}
        {user && (
          <button className="ghost-btn" onClick={logout} type="button">
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}
