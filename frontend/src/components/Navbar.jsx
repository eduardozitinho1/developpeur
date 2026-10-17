import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [q, setQ] = useState("");
  const nav = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    nav(`/browse?q=${encodeURIComponent(q)}`);
  };

  const initial = user?.username?.[0]?.toUpperCase() || "?";

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">✦</span>
          <span className="brand-text">Développeur</span>
        </Link>

        <form className="nav-search" onSubmit={submit}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar snippets, tags, linguagens..."
            aria-label="Buscar"
          />
          <button type="submit" aria-label="Buscar">↵</button>
        </form>

        <nav className="nav-links">
          <NavLink to="/browse">Explorar</NavLink>
          {user ? (
            <>
              <NavLink to="/snippets/new" className="nav-cta">+ Novo snippet</NavLink>
              <Link to={`/u/${user.username}`} className="avatar-link">
                <span className="avatar" style={{ background: user.avatar_color }}>
                  {initial}
                </span>
              </Link>
              <button className="btn-ghost" onClick={logout}>Sair</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Entrar</NavLink>
              <NavLink to="/register" className="nav-cta">Criar conta</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
