import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await api.post("/api/auth/login", form);
      login(r.data.access_token, r.data.user);
      nav(loc.state?.from || "/", { replace: true });
    } catch (e) {
      setErr(e.response?.data?.detail || "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1>Entrar</h1>
        <p className="auth-sub">Bem-vindo de volta ao Développeur.</p>
        <label>
          Usuário ou e-mail
          <input
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            autoComplete="username"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
          />
        </label>
        {err && <div className="form-error">{err}</div>}
        <button className="btn-primary" disabled={busy}>
          {busy ? "Entrando..." : "Entrar"}
        </button>
        <p className="auth-foot">
          Ainda não tem conta? <Link to="/register">Criar conta</Link>
        </p>
      </form>
    </div>
  );
}
