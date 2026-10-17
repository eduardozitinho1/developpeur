import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth";

const COLORS = [
  "#7c5cff",
  "#ff5c8a",
  "#5cd0ff",
  "#ffb85c",
  "#5cffb1",
  "#c45cff",
];

export default function Register() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    avatar_color: COLORS[0],
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await api.post("/api/auth/register", form);
      login(r.data.access_token, r.data.user);
      nav("/", { replace: true });
    } catch (e) {
      const d = e.response?.data?.detail;
      setErr(typeof d === "string" ? d : "Não foi possível criar a conta.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1>Criar conta</h1>
        <p className="auth-sub">Comece a publicar seus snippets.</p>
        <label>
          Usuário
          <input
            required
            minLength={3}
            maxLength={40}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            autoComplete="username"
          />
        </label>
        <label>
          E-mail
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
          />
        </label>
        <label>
          Cor do avatar
          <div className="color-row">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={`color-swatch ${form.avatar_color === c ? "active" : ""}`}
                style={{ background: c }}
                onClick={() => setForm({ ...form, avatar_color: c })}
                aria-label={`Cor ${c}`}
              />
            ))}
          </div>
        </label>
        {err && <div className="form-error">{err}</div>}
        <button className="btn-primary" disabled={busy}>
          {busy ? "Criando..." : "Criar conta"}
        </button>
        <p className="auth-foot">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
