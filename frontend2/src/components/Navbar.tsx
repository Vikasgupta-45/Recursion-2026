import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-lg font-semibold tracking-wide text-cyan-300">
          Project Growth Engine
        </Link>
        <nav className="flex items-center gap-5 text-sm text-slate-300">
          <NavLink to="/" className="nav-link">
            Home
          </NavLink>
          {!user && (
            <>
              <NavLink to="/login" className="nav-link">
                Login
              </NavLink>
              <NavLink to="/register" className="nav-link">
                Register
              </NavLink>
            </>
          )}
          {user && (
            <>
              <NavLink to="/dashboard/intelligence" className="nav-link">
                Dashboard
              </NavLink>
              <button type="button" onClick={logout} className="rounded-lg border border-cyan-400/40 px-3 py-1">
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
